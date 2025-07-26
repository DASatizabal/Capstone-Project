/* eslint-disable no-param-reassign */
import mongoose, {
  Schema,
  Document,
  SchemaTypeOptions,
  SchemaDefinition,
  SchemaDefinitionType,
} from "mongoose";

// Add this type at the top of the file
type TransformFunction = (doc: any, ret: any, options: any) => any;

/**
 * Interface for schema path options with our custom options
 */
interface CustomSchemaPathOptions extends SchemaTypeOptions<any> {
  private?: boolean;
  sensitive?: boolean;
  hideInJSON?: boolean | ((doc: any) => boolean);
}

/**
 * Recursively deletes a nested property from an object
 * @param obj - The object to modify
 * @param path - Path to the property to delete (as array of strings)
 * @param index - Current index in the path array
 */
const deleteAtPath = (
  obj: Record<string, any>,
  path: string[],
  index: number,
): void => {
  if (!obj || typeof obj !== "object" || !(path[index] in obj)) {
    return;
  }

  if (index === path.length - 1) {
    delete obj[path[index]];
    return;
  }

  deleteAtPath(obj[path[index]], path, index + 1);
};

/**
 * A mongoose schema plugin that enhances the toJSON transform with the following features:
 * - Removes __v, _id (replaces with id)
 * - Removes any path marked with `private: true` or `sensitive: true`
 * - Conditionally removes fields based on a function
 * - Supports nested schema paths
 * - Type-safe implementation
 */
const toJSON = (schema: Schema): void => {
  // Get all paths that should be transformed
  const transformPaths: Array<{
    path: string;
    options: CustomSchemaPathOptions;
  }> = [];

  // Collect all paths with custom options
  schema.eachPath((path, type) => {
    const schemaType = schema.path(path);
    if (schemaType.options) {
      transformPaths.push({
        path,
        options: schemaType.options as CustomSchemaPathOptions,
      });
    }
  });

  // Configure the toJSON transform
  schema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform(doc: any, ret: Record<string, any>, options: any) {
      // Handle nested paths and custom options
      transformPaths.forEach(({ path, options: pathOptions }) => {
        const shouldRemove =
          pathOptions.private ||
          pathOptions.sensitive ||
          (typeof pathOptions.hideInJSON === "function"
            ? pathOptions.hideInJSON(doc)
            : pathOptions.hideInJSON);

        if (shouldRemove) {
          deleteAtPath(ret, path.split("."), 0);
        }
      });

      // Transform _id to id
      if (ret._id && typeof ret._id.toString === "function") {
        ret.id = ret._id.toString();
      }

      // Remove version key
      delete ret.__v;
      delete ret._id;

      // Remove any remaining private fields that might have been missed
      Object.keys(ret).forEach((key) => {
        if (key.startsWith("_")) {
          delete ret[key];
        }
      });

      // Apply any schema-level transforms
      const transform = (schema as any).get("toJSON")?.transform;
      if (typeof transform === "function") {
        return transform(doc, ret, options);
      }

      return ret;
    },
  });
};

export default toJSON;

//   if (schema.options.toJSON && schema.options.toJSON.transform) {
//     transform = schema.options.toJSON.transform;
//   }

//   schema.options.toJSON = Object.assign(schema.options.toJSON || {}, {
//     transform(doc: T, ret: any, options: any) {
//       Object.keys(schema.paths).forEach((path) => {
//         if (schema.paths[path].options && schema.paths[path].options.private) {
//           deleteAtPath(ret, path.split('.'), 0);
//         }
//       });

//       if (ret._id) {
//         ret.id = ret._id.toString();
//       }
//       delete ret._id;
//       delete ret.__v;

//       if (transform) {
//         return transform(doc, ret, options);
//       }
//     },
//   });
// };

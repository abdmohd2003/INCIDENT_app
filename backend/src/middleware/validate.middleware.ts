// import { Request, Response, NextFunction } from "express";
// import { ZodType } from "zod";
// type ValidationData = { body: unknown; query: unknown; params: unknown; };
// export const validateQuery = (
//   schema: ZodType<ValidationData>
// ) => {
//   return (
//     req: Request,
//     res: Response,
//     next: NextFunction
//   ) => {
//     const result = schema.safeParse({
//       body: req.body,
//       query: req.query,
//       params: req.params,
//     });
//     if (!result.success) {
//       return res.status(400).json({
//         success: false,
//         error: {
//           message: "Invalid query parameters",
//           details: result.error.issues.map((issue) => ({
//             field: issue.path.join("."),
//             message: issue.message,
//           })),
//         },
//       });
//     }
//     req.body = result.data.body;
//     req.params = result.data.params as typeof req.params;
//     next();
//   };
// };

import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

export const validateQuery = (schema: ZodType) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Invalid query parameters",
          details: result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
      });
    }

    res.locals.validatedQuery = result.data;

    next();
  };
};
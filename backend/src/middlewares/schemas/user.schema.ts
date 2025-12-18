import { secureHeapUsed } from "node:crypto";
import {date, z} from "zod";


export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    primaryMobile: z.string().regex(/^\+[1-9]\d{1,14}$/, "Invalid phone number"),
    secondaryMobile: z.string().regex(/^\+[1-9]\d{1,14}$/, "Invalid phone number"),
    aadhaar: z.string().regex(/^\d{12}$/, "Invalid Aadhaar number"),
    pan: z.string().trim().toUpperCase().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN format"),
    dateOfBirth: z.string().regex(/\d{4}-\d{2}-\d{2}/),
    placeOfBirth: z.string().min(2),
    currentAddress: z.string().min(5),
    permanentAddress: z.string().min(5),
  }),
});

// const MIN_AGE = 18;
// const MAX_AGE = 200;

// export const dobSchema = z
//   .string()
//   .refine((val) => !Number.isNaN(Date.parse(val)), {
//     message: "Invalid date format",
//   })
//   .transform((val) => new Date(val))
//   .refine((date) => date < new Date(), {
//     message: "Date of birth must be in the past",
//   })
//   .refine((date) => {
//     const today = new Date();
//     let age = today.getFullYear() - date.getFullYear();

//     const m = today.getMonth() - date.getMonth();
//     if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
//       age--;
//     }

//     return age >= MIN_AGE && age <= MAX_AGE;
//   }, {
//     message: `Age must be between ${MIN_AGE} and ${MAX_AGE}`,
//   });



export const getUsersSchema = z.object({
  query:z.object({
    limit: z.coerce.number().int().positive().max(100).optional().default(5),
    cursor: z.string().optional(),
    name: z.string().optional(),
    email: z.string().optional(),
    mobile: z.string().optional(),
    dob: z.string().optional(),
  })
})
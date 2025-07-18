import { Schema, model } from "mongoose";

interface Employee {
  email: string;
  name: string;
  password: string;
  role: string;
  active: boolean;
  image:string;
  mobile:number;
  isDeleted: boolean;
}

const employeeScheam = new Schema<Employee>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
    },
    mobile:{
      type:Number,
    },
    password: {
      type: String,
      required: true,
    },
    image:{
      type:String,
    },
    role: {
      type: String,
      default: "employee",
      required: true,
    },
    active: {
      type: Boolean,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    autoIndex: true,
  }
);

// employeeScheam.pre("save", async function (next) {
//   if (!this.isModified("password")) {
//     return next();
//   }

//   this.password = await Bun.password.hash(this.password);

//   next();
// });

export const Employee = model<Employee>("Employee", employeeScheam);

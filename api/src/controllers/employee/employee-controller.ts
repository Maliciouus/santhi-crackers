import { deleteFile, saveFile } from "@/lib/file";
import Elysia, { t } from "elysia";
import { Employee } from "@/models/emp/employee-model";

export const employeeController = new Elysia({
  prefix: "/emp",
  detail: {
    tags: ["employee - Profile"],
  },
})
.put(
    "/update",
    async ({ body, store, set }) => {
      try {
        const _store: any = store;
        const id = _store?.id ?? "";
  
        const { username, image, mobile, password } = body;
        const emp = await Employee.findById(id);
  
        if (!emp) {
          return {
            message: "Employee not found",
            status: false,
          };
        }
  
        let updated = false;
        let passwordSame = false;
  
        // Handle image update
        if (image) {
          const { filename, ok } = await saveFile(image, "profile-images");
          if (!ok) {
            set.status = 400;
            return {
              status: false,
              message: "Unable to upload profile image",
            };
          }
          if (emp.image) {
            deleteFile(emp.image, "profile-images");
          }
          emp.image = filename;
          updated = true;
        }
  
        // Username update
        if (username && username !== emp.name) {
          emp.name = username;
          updated = true;
        }
  
        // Mobile number comparison as string
        if (mobile && String(mobile) !== String(emp.mobile)) {
          emp.mobile = Number(mobile);
          updated = true;
        }
  
        // Password check and update
        if (password) {
            if(password!=emp.password){
                emp.password=password;
                updated=true;
            }
            else {
                passwordSame = true;
              }
        }
  
        if (!updated && !passwordSame) {
          set.status = 400;
          return {
            status: false,
            message: "Nothing to update",
          };
        }
  
        await emp.save();
  
        return {
          message: passwordSame
            ? "Profile updated. Password remains the same."
            : "Profile updated successfully",
          status: true,
          emp,
          passwordSame,
        };
      } catch (error) {
        console.error(error);
        set.status = 500;
        return {
          status: false,
          message: "Something went wrong",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      body: t.Object({
        username: t.Optional(t.String({ default: "" })),
        image: t.Optional(t.Any()),
        mobile: t.Optional(t.String()),
        password: t.Optional(t.String()),
      }),
      detail: {
        summary: "Update employee profile",
        description: "Allows employees to update their profile details.",
      },
    }
  )

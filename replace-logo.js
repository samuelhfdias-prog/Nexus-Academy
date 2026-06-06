import fs from "fs";
import path from "path";

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.tsx') || dirFile.endsWith('.ts')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const files = walkSync(path.resolve("./client/src"));

files.forEach(file => {
  let content = fs.readFileSync(file, "utf8");
  if (content.includes("BookOpen")) {
    // replace imports
    content = content.replace(/BookOpen,/g, "");
    content = content.replace(/,\s*BookOpen/g, "");
    content = content.replace(/BookOpen/g, "Logo");
    
    // add Logo import if not present
    if (!content.includes("import { Logo }") && !content.includes("import {Logo}")) {
      content = `import { Logo } from "@/components/Logo";\n` + content;
    }
    
    fs.writeFileSync(file, content, "utf8");
    console.log("Updated", file);
  }
});

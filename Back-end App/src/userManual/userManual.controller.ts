import { Request, Response } from "express";
import path, { join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const manualByRole: Record<string, string> = {
  client: "DeliverIt - Manual de Usuario Cliente.pdf",
  owner: "DeliverIt - Manual de Usuario Dueño de Local.pdf",
  delivery: "DeliverIt - Manual de Usuario Repartidor.pdf",
  admin: "DeliverIt - Manual de Usuario Administrador.pdf",
};

export function downloadManual(req: Request, res: Response) {
  const fileName = manualByRole[req.params.role];

  if (!fileName) {
    return res.status(404).json({ message: "Manual not found" });
  }

  const filePath = join(__dirname, "../../src/shared/assets", fileName);
  return res.download(filePath, fileName, (error) => {
    if (error) {
      return res.status(500).json({ message: error.message });
    }
  });
}
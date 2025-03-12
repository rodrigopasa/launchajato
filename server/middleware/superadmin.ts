
import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

// Lista de usuários que possuem acesso ao SuperAdmin (adicione aqui apenas o seu usuário)
const SUPER_ADMIN_USERS = ["admin"]; // Use o nome de usuário do administrador principal

export const isSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  try {
    const user = await storage.getUser(req.session.userId);
    
    if (!user) {
      return res.status(403).json({ message: "Usuário não encontrado" });
    }
    
    // Verificar se o usuário é admin E se está na lista de super admins
    if (user.role !== "admin" || !SUPER_ADMIN_USERS.includes(user.username)) {
      return res.status(403).json({ 
        message: "Acesso restrito: apenas o administrador principal tem permissão para acessar esta área" 
      });
    }
    
    next();
  } catch (error) {
    console.error("Erro ao verificar permissões de SuperAdmin:", error);
    return res.status(500).json({ message: "Erro interno ao verificar permissões" });
  }
};

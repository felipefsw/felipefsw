import Link from "next/link";
import { Card } from "@/components/ui";

export default function RecuperarSenhaPage() {
  return (
    <div className="mx-auto max-w-md px-5 py-8">
      <h1 className="mb-4 text-xl font-bold text-gray-900">Esqueci minha senha</h1>
      <div className="space-y-4">
        <Card>
          <h2 className="font-semibold text-gray-900">Diarista, Lojista e Gestor</h2>
          <p className="mt-1 text-sm text-gray-600">
            Peça ao RH/TI para gerar um <strong>link de redefinição</strong>. Eles enviam pelo seu
            WhatsApp e você cria uma nova senha com segurança — ninguém mais tem acesso a ela.
          </p>
        </Card>
        <Card>
          <h2 className="font-semibold text-gray-900">RH / TI</h2>
          <p className="mt-1 text-sm text-gray-600">
            Outro membro do TI pode redefinir seu acesso em <strong>Equipe RH/TI → Resetar senha</strong>,
            gerando um link novo para você.
          </p>
        </Card>
        <p className="text-center text-sm">
          <Link href="/entrar" className="font-medium text-orange-700 underline">
            Voltar para o login
          </Link>
        </p>
      </div>
    </div>
  );
}

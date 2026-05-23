import Link from "next/link";
import { Card } from "@/components/ui";

export default function RecuperarSenhaPage() {
  return (
    <div className="mx-auto max-w-md px-5 py-8">
      <h1 className="mb-4 text-xl font-bold text-gray-900">Recuperar senha</h1>
      <div className="space-y-4">
        <Card>
          <h2 className="font-semibold text-gray-900">Diarista</h2>
          <p className="mt-1 text-sm text-gray-600">
            Você não usa senha — entra apenas com o CPF. Se o CPF não for encontrado,
            faça o cadastro novamente.
          </p>
        </Card>
        <Card>
          <h2 className="font-semibold text-gray-900">Lojista</h2>
          <p className="mt-1 text-sm text-gray-600">
            Fale com o RH/TI para redefinir a senha da sua loja. A senha inicial é{" "}
            <strong>123456</strong>.
          </p>
        </Card>
        <Card>
          <h2 className="font-semibold text-gray-900">RH / TI</h2>
          <p className="mt-1 text-sm text-gray-600">
            A senha de gestão é definida pelo TI (variável de ambiente no servidor).
            Por padrão é <strong>123456</strong> — recomendamos trocar em produção.
          </p>
        </Card>
        <p className="text-center text-sm">
          <Link href="/entrar" className="font-medium text-teal-700 underline">
            Voltar para o login
          </Link>
        </p>
      </div>
    </div>
  );
}

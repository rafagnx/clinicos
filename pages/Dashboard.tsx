import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// STATIC VERSION - NO IMPORTS FROM LIB OR COMPONENTS
export default function Dashboard() {
  console.log("🔵 ABSOLUTE ZERO DASHBOARD MOUNTED");

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log("🔵 DASHBOARD EFFECT RUNNING");
  }, []);

  if (!mounted) return <div className="p-10 text-blue-500">Hydrating...</div>;

  return (
    <div className="p-8 w-full min-h-screen bg-blue-50">
      <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-200">
        <h1 className="text-3xl font-bold text-blue-900 mb-4">
          DASHBOARD V5 - ABSOLUTE ZERO
        </h1>
        <p className="text-lg text-slate-700 mb-4">
          Se você está lendo isso, o problema NÃO é o Layout e NÃO é o Roteamento.
        </p>
        <p className="text-md text-slate-600">
          Data atual: {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}
        </p>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="font-bold text-yellow-800">Próximo Passo (Debug):</h3>
          <p className="text-sm text-yellow-700">
            Se esta tela aparecer, vou reativar o <strong>base44 client</strong> para testar a conexão com o banco de dados.
          </p>
        </div>
      </div>
    </div>
  );
}

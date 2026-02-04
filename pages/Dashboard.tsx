import React from "react";
import { useOutletContext } from "react-router-dom";

export default function Dashboard() {
  console.log("🔵 MINIMAL DASHBOARD MOUNTED");

  return (
    <div className="p-10 bg-red-500 min-h-screen">
      <h1 className="text-4xl text-white font-bold mb-4">
        TESTE DE DIAGNÓSTICO
      </h1>
      <p className="text-white text-xl">
        Se você está vendo isso, o arquivo Dashboard.tsx está carregando corretamente.
        O erro está nos componentes ou dados.
      </p>
      <div className="mt-8 p-4 bg-white rounded shadow">
        <p className="text-black">
          Próximo passo: Vou restaurar o dashboard linha por linha para achar o erro.
        </p>
      </div>
    </div>
  );
}

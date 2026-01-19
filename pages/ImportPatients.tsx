import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Upload, FileSpreadsheet, CheckCircle2,
  AlertCircle, Loader2, Download, Info
} from "lucide-react";
import { toast } from "sonner";

export default function ImportPatients() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const fileName = selectedFile.name.toLowerCase();

      if (fileName.endsWith('.csv')) {
        setFile(selectedFile);
        setResult(null);
      } else {
        toast.error("Por favor, selecione um arquivo CSV (.csv). Converta seu Excel para CSV primeiro!");
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Selecione um arquivo primeiro");
      return;
    }

    try {
      setIsUploading(true);
      setProgress(10);

      // Read file content
      const text = await file.text();
      const rows = text.split("\n").map(r => r.trim()).filter(r => r);

      const headers = rows[0].split(",").map(h => h.trim().replace(/"/g, ''));
      const dataRows = rows.slice(1);

      setIsUploading(false);
      setIsProcessing(true);
      setProgress(30);

      let imported = 0;
      let failed = 0;
      const errors = [];
      const total = dataRows.length;

      // Process batches
      for (let i = 0; i < total; i++) {
        try {
          // Simple CSV parser (doesn't handle commas inside quotes perfectly but good enough for simple case)
          const cols = dataRows[i].split(",");
          // Map to object based on headers
          const patientData = {};
          headers.forEach((h, index) => {
            if (cols[index]) patientData[h] = cols[index].replace(/"/g, '').trim();
          });

          if (!patientData.full_name) throw new Error("Nome obrigatório");

          // Basic validation/formatting
          if (patientData.birth_date && !patientData.birth_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Try to parse if DD/MM/YYYY
            const parts = patientData.birth_date.split('/');
            if (parts.length === 3) patientData.birth_date = `${parts[2]}-${parts[1]}-${parts[0]}`;
            else delete patientData.birth_date; // Invalid format
          }

          patientData.status = "ativo";

          await base44.entities.Patient.create(patientData);
          imported++;
        } catch (err) {
          failed++;
          errors.push({ row: i + 2, message: err.message || "Erro desconhecido" });
        }

        const currentProgress = 30 + Math.floor((i / total) * 70);
        setProgress(currentProgress);
      }

      setProgress(100);
      setResult({
        total,
        imported,
        failed,
        errors
      });
      toast.success("Processamento concluído!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao importar pacientes. Verifique o formato do arquivo.");
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const headers = "full_name,phone,email,birth_date,gender,cpf,address\n";
    const example = "João Silva,11999998888,joao@email.com,1990-05-15,masculino,123.456.789-00,\"Rua Exemplo, 123\"\n";
    const blob = new Blob([headers + example], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_importacao_pacientes.csv';
    a.click();
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl("Patients"))}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Importar Pacientes</h1>
          <p className="text-slate-500">Adicione múltiplos pacientes de uma vez usando um arquivo CSV</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card className="p-8 border-2 border-dashed border-slate-200 bg-slate-50/50">
            {!result ? (
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-white rounded-full shadow-sm border border-slate-100">
                  <FileSpreadsheet className="w-10 h-10 text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg">Selecione seu arquivo CSV</h3>
                  <p className="text-sm text-slate-500 max-w-xs">
                    O arquivo deve conter as colunas: nome, telefone, email e data de nascimento.
                  </p>
                </div>

                <div className="w-full max-w-xs pt-4">
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                    disabled={isUploading || isProcessing}
                  />
                </div>

                {file && !isUploading && !isProcessing && (
                  <Button onClick={handleImport} className="w-full max-w-xs">
                    Iniciar Importação
                  </Button>
                )}

                {(isUploading || isProcessing) && (
                  <div className="w-full max-w-xs space-y-3">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {isUploading ? "Enviando arquivo..." : "Processando dados..."}
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <div className="p-2 bg-emerald-500 rounded-full text-white">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-900">Importação Finalizada</h3>
                    <p className="text-sm text-emerald-700">
                      Processamos {result.total} registros do seu arquivo.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white border rounded-lg text-center">
                    <p className="text-2xl font-bold text-slate-900">{result.imported}</p>
                    <p className="text-xs text-slate-500 uppercase font-bold">Sucesso</p>
                  </div>
                  <div className="p-4 bg-white border rounded-lg text-center">
                    <p className="text-2xl font-bold text-rose-600">{result.failed}</p>
                    <p className="text-xs text-slate-500 uppercase font-bold">Erros</p>
                  </div>
                </div>

                {result.errors?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                      Detalhes dos Erros:
                    </p>
                    <div className="max-h-40 overflow-y-auto p-3 bg-slate-900 rounded-lg text-xs font-mono text-slate-300 space-y-1">
                      {result.errors.map((err, i) => (
                        <div key={i} className="border-b border-slate-800 pb-1 mb-1 last:border-0">
                          Linha {err.row}: {err.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button variant="outline" className="w-full" onClick={() => {
                  setFile(null);
                  setResult(null);
                  setProgress(0);
                }}>
                  Importar outro arquivo
                </Button>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              Instruções
            </h3>
            <ul className="text-sm text-slate-600 space-y-3">
              <li className="flex gap-2">
                <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center">1</Badge>
                <span>Use o modelo CSV para garantir que as colunas estejam corretas.</span>
              </li>
              <li className="flex gap-2">
                <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center">2</Badge>
                <span>Datas devem estar no formato <strong>AAAA-MM-DD</strong>.</span>
              </li>
              <li className="flex gap-2">
                <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center">3</Badge>
                <span>O campo <strong>full_name</strong> é obrigatório.</span>
              </li>
            </ul>
            <Button variant="outline" className="w-full" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Baixar Modelo CSV
            </Button>
          </Card>

          <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Dica:</strong> Se você tem uma planilha Excel, salve-a como "CSV (Separado por vírgulas)" antes de enviar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

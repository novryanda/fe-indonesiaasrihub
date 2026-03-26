"use client";

import { type ChangeEvent, useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { ArrowLeft, Download, FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSession } from "@/lib/auth-client";

import { useImportUsers } from "../hooks/use-import-users";
import type { ImportUsersResult } from "../types/user-management.type";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const CSV_HEADER = "name,email,role,wilayah_id";
const CSV_SAMPLE_ROWS = [
  "Budi Santoso,budi.santoso@asrihub.id,wcc,",
  "Siska Prameswari,siska.prameswari@asrihub.id,pic_sosmed,",
  "Rina Pratama,rina.pratama@asrihub.id,qcc_wcc,wly_jateng",
];

function triggerFileDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function buildExcelXmlTemplate() {
  const rows = [
    ["name", "email", "role", "wilayah_id"],
    ["Budi Santoso", "budi.santoso@asrihub.id", "wcc", ""],
    ["Siska Prameswari", "siska.prameswari@asrihub.id", "pic_sosmed", ""],
    ["Rina Pratama", "rina.pratama@asrihub.id", "qcc_wcc", "wly_jateng"],
  ];

  const rowXml = rows
    .map((row) => `<Row>${row.map((cell) => `<Cell><Data ss:Type="String">${cell}</Data></Cell>`).join("")}</Row>`)
    .join("");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Template Import User">
  <Table>
   ${rowXml}
  </Table>
 </Worksheet>
</Workbook>`;
}

interface UserImportContentProps {
  accessToken?: string;
}

function UserImportContent({ accessToken }: UserImportContentProps) {
  const router = useRouter();
  const { importCsv, isSubmitting } = useImportUsers(accessToken);

  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportUsersResult | null>(null);

  const fileError = useMemo(() => {
    if (!file) {
      return "";
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return "File harus berformat .csv";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "Ukuran file melebihi 5MB";
    }

    return "";
  }, [file]);

  const handleSelectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    setResult(null);
    setFile(selectedFile);
  };

  const handleImport = async () => {
    if (!file || fileError) {
      return;
    }

    try {
      const importResult = await importCsv(file);
      setResult(importResult);

      toast.success(`Import selesai: ${importResult.imported} berhasil, ${importResult.skipped} dilewati`);
      router.push("/pengaturan/manajemen-user");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
        return;
      }

      toast.error("Gagal import user");
    }
  };

  return (
    <div className="space-y-4">
      <Card size="sm">
        <CardHeader>
          <CardTitle>Import User via CSV</CardTitle>
          <CardDescription>
            Gunakan file CSV dengan header wajib berurutan: <strong>{CSV_HEADER}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                triggerFileDownload(
                  `${CSV_HEADER}\n${CSV_SAMPLE_ROWS.join("\n")}`,
                  "template-import-user.csv",
                  "text/csv;charset=utf-8",
                )
              }
            >
              <Download className="mr-2 size-4" />
              Download Template CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                triggerFileDownload(
                  buildExcelXmlTemplate(),
                  "template-import-user.xls",
                  "application/vnd.ms-excel;charset=utf-8",
                )
              }
            >
              <FileSpreadsheet className="mr-2 size-4" />
              Download Template Excel
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="import-users-file">File CSV</Label>
            <Input id="import-users-file" type="file" accept=".csv,text/csv" onChange={handleSelectFile} />
            {file ? <p className="text-muted-foreground text-sm">File dipilih: {file.name}</p> : null}
            {fileError ? <p className="text-destructive text-sm">{fileError}</p> : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={handleImport} disabled={!file || Boolean(fileError) || isSubmitting}>
              {isSubmitting ? (
                <span className="inline-flex items-center">
                  <Spinner className="mr-2" />
                  Memproses import...
                </span>
              ) : (
                <span className="inline-flex items-center">
                  <Upload className="mr-2 size-4" />
                  Mulai Import
                </span>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/pengaturan/manajemen-user")}>
              <ArrowLeft className="mr-2 size-4" />
              Kembali ke Manajemen User
            </Button>
          </div>
        </CardContent>
      </Card>

      {result ? (
        <Card size="sm">
          <CardHeader>
            <CardTitle>Ringkasan Import</CardTitle>
            <CardDescription>Hasil proses upload terakhir</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Berhasil: {result.imported}</Badge>
              <Badge variant="outline">Dilewati: {result.skipped}</Badge>
            </div>

            {result.errors.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Baris</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Alasan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.errors.map((item) => (
                      <TableRow key={`${item.row}-${item.email}-${item.reason}`}>
                        <TableCell>{item.row}</TableCell>
                        <TableCell>{item.email || "-"}</TableCell>
                        <TableCell>{item.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Tidak ada error pada proses import.</p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export function UserImportView() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const accessToken = (session as { session?: { token?: string } } | null | undefined)?.session?.token;

  const role = ((session?.user as { role?: string } | undefined)?.role ?? "wcc") as
    | "superadmin"
    | "qcc_wcc"
    | "wcc"
    | "pic_sosmed";

  const isAuthorized = role === "superadmin";

  useEffect(() => {
    if (!isPending && session && !isAuthorized) {
      router.replace("/unauthorized");
    }
  }, [isAuthorized, isPending, router, session]);

  if (isPending) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <Spinner />
          <span>Memuat session...</span>
        </CardContent>
      </Card>
    );
  }

  if (!session || !isAuthorized) {
    return null;
  }

  return <UserImportContent accessToken={accessToken} />;
}

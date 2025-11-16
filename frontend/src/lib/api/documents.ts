import { apiClient } from "./client";
import type { TaxDocumentMetadata, TaxDocumentTextResponse } from "./types";

export interface ListDocumentsParams {
  tax_year?: number;
  doc_type?: string;
}

export const fetchDocuments = async (
  params?: ListDocumentsParams,
): Promise<TaxDocumentMetadata[]> => {
  const response = await apiClient.get<TaxDocumentMetadata[]>("/api/documents", {
    params,
  });
  return response.data;
};

export const fetchDocumentMetadata = async (
  docId: string,
): Promise<TaxDocumentMetadata> => {
  const response = await apiClient.get<TaxDocumentMetadata>(
    `/api/documents/${docId}`,
  );
  return response.data;
};

export const fetchDocumentText = async (
  docId: string,
): Promise<TaxDocumentTextResponse> => {
  const response = await apiClient.get<TaxDocumentTextResponse>(
    `/api/documents/${docId}/text`,
  );
  return response.data;
};

export const uploadDocument = async (
  file: File,
): Promise<TaxDocumentMetadata> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<TaxDocumentMetadata>(
    "/api/documents/ingest",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
};

export const getDocumentFileUrl = (docId: string): string => {
  const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
  return `${baseURL}/api/documents/${docId}/file`;
};

export const fetchDocumentStatus = async (
  docId: string,
): Promise<TaxDocumentMetadata> => {
  // Use the regular metadata endpoint which includes status
  const response = await apiClient.get<TaxDocumentMetadata>(
    `/api/documents/${docId}`,
  );
  return response.data;
};

export const deleteAllDocuments = async (): Promise<{
  deleted_count: number;
  message: string;
}> => {
  const response = await apiClient.delete<{
    deleted_count: number;
    message: string;
  }>("/api/documents");
  return response.data;
};


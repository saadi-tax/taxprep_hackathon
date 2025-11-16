import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteAllDocuments,
  fetchDocumentMetadata,
  fetchDocumentStatus,
  fetchDocumentText,
  fetchDocuments,
  uploadDocument,
  type ListDocumentsParams,
} from "../api/documents";
import type { TaxDocumentMetadata } from "../api/types";

export const useDocuments = (params?: ListDocumentsParams) => {
  return useQuery({
    queryKey: ["documents", params],
    queryFn: () => fetchDocuments(params),
  });
};

export const useDocumentMetadata = (docId: string | null) => {
  return useQuery({
    queryKey: ["documents", docId, "metadata"],
    queryFn: () => fetchDocumentMetadata(docId!),
    enabled: docId !== null,
  });
};

export const useDocumentText = (docId: string | null) => {
  return useQuery({
    queryKey: ["documents", docId, "text"],
    queryFn: () => fetchDocumentText(docId!),
    enabled: docId !== null,
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      // Invalidate and refetch documents list
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
};

export const useDeleteAllDocuments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAllDocuments,
    onSuccess: () => {
      // Invalidate and refetch documents list
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      // Also clear any individual document queries
      queryClient.removeQueries({ queryKey: ["documents"] });
    },
  });
};

export const useDocumentStatus = (
  docId: string | null,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: ["documents", docId, "status"],
    queryFn: () => fetchDocumentStatus(docId!),
    enabled: enabled && docId !== null,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Poll every 2 seconds if pending or processing, stop if completed or failed
      if (data?.status === "pending" || data?.status === "processing") {
        return 2000;
      }
      return false;
    },
  });
};


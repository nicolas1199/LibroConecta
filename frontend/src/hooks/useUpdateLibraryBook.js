import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateReadingStatus } from "../api/userLibrary";

export const useUpdateLibraryBook = () => {
  const queryClient = useQueryClient();

  const updateBookMutation = useMutation({
    mutationFn: (variables) => {
      const { id, updateData } = variables;
      return updateReadingStatus(id, updateData);
    },
    onSuccess: () => {
      // Invalidar todas las queries relacionadas con la biblioteca
      queryClient.invalidateQueries({ queryKey: ["library"] });
      queryClient.invalidateQueries({ queryKey: ["libraryStats"] });
    },
  });

  return {
    updateBook: (id, updateData) =>
      updateBookMutation.mutate({ id, updateData }),
    updateBookAsync: (id, updateData) =>
      updateBookMutation.mutateAsync({ id, updateData }),
    isUpdating: updateBookMutation.isPending,
    error: updateBookMutation.error,
    isSuccess: updateBookMutation.isSuccess,
    reset: updateBookMutation.reset,
  };
};

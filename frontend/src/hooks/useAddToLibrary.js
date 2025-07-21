import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addToLibrary } from "../api/userLibrary";

export const useAddToLibrary = () => {
  const queryClient = useQueryClient();

  const addBookMutation = useMutation({
    mutationFn: addToLibrary,
    onSuccess: () => {
      // Invalidar todas las queries relacionadas con la biblioteca
      queryClient.invalidateQueries({ queryKey: ["library"] });
      queryClient.invalidateQueries({ queryKey: ["libraryStats"] });
    },
  });

  return {
    addBook: addBookMutation.mutate,
    addBookAsync: addBookMutation.mutateAsync,
    isAdding: addBookMutation.isPending,
    error: addBookMutation.error,
    isSuccess: addBookMutation.isSuccess,
    reset: addBookMutation.reset,
  };
};

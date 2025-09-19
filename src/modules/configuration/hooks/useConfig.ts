import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AppConfig } from '@types';
import { configApi } from '../api';

const CONFIG_QUERY_KEY = ['config'];

const defaultConfig: AppConfig = { platforms: [] };

const fetchConfig = async (): Promise<AppConfig> => {
  await configApi.migrateFromLocalStorage();
  const savedConfig = await configApi.loadConfig();
  return savedConfig ?? defaultConfig;
};

interface UseConfigOptions {
  enabled: boolean;
}

interface MutationContext {
  previousConfig?: AppConfig;
}

export const useConfig = ({ enabled }: UseConfigOptions) => {
  const queryClient = useQueryClient();

  const queryResult = useQuery({
    queryKey: CONFIG_QUERY_KEY,
    queryFn: fetchConfig,
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const mutation = useMutation<AppConfig, Error, AppConfig, MutationContext>({
    mutationFn: async (config) => {
      await configApi.saveConfig(config);
      return config;
    },
    onMutate: async (newConfig) => {
      await queryClient.cancelQueries({ queryKey: CONFIG_QUERY_KEY });
      const previousConfig = queryClient.getQueryData<AppConfig>(CONFIG_QUERY_KEY);
      queryClient.setQueryData(CONFIG_QUERY_KEY, newConfig);
      return { previousConfig };
    },
    onError: (_error, _newConfig, context) => {
      if (context?.previousConfig) {
        queryClient.setQueryData(CONFIG_QUERY_KEY, context.previousConfig);
      }
    }
  });

  useEffect(() => {
    if (!enabled) {
      queryClient.removeQueries({ queryKey: CONFIG_QUERY_KEY });
    }
  }, [enabled, queryClient]);

  return {
    config: queryResult.data ?? defaultConfig,
    isLoading: queryResult.isLoading,
    isFetching: queryResult.isFetching,
    isSaving: mutation.isPending,
    saveConfig: mutation.mutateAsync,
    refetchConfig: queryResult.refetch,
  };
};


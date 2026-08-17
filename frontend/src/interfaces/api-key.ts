import type { ApiKey } from 'models';

export type CreateApiKeyDto = Omit<ApiKey, 'id' | 'filial'>;
export type UpdateApiKeyDto = Partial<CreateApiKeyDto>;

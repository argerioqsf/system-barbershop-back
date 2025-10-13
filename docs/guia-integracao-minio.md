# Guia de Integração do MinIO com o Projeto system-barbershop-back

Este guia descreve o passo a passo completo para integrar o **MinIO** ao backend Fastify/Prisma do projeto **system-barbershop-back**, hospedado na **DigitalOcean com EasyPanel**.

---

## 0) Objetivo Arquitetural

Duas abordagens possíveis para upload:
- **A)** Upload direto do cliente → MinIO via URL pré-assinada (recomendado)
- **B)** Upload via servidor (stream)

Ambas utilizam o SDK AWS S3 (v3) apontando para o endpoint do MinIO, com `forcePathStyle: true`.

---

## 1) Infraestrutura no EasyPanel

1. **Instalar o MinIO**  
   No EasyPanel, adicione o app MinIO pelo template 1-click.

2. **Domínio & TLS**  
   - Configure subdomínio `minio.seudominio.com`
   - Ative HTTPS com Let’s Encrypt.

3. **Criar Bucket e Usuário**  
   - Crie o bucket `barbershop` (privado).
   - Crie um usuário de serviço (AccessKey/SecretKey).

4. **Anote:**  
   - Endpoint: `https://minio.seudominio.com`
   - AccessKey e SecretKey
   - Bucket
   - Região (ex.: `us-east-1`)

---

## 2) Variáveis de Ambiente

Adicione no `.env`:

```bash
S3_ENDPOINT=https://minio.seudominio.com
S3_REGION=us-east-1
S3_ACCESS_KEY=****************
S3_SECRET_KEY=****************
S3_BUCKET=barbershop
S3_FORCE_PATH_STYLE=true
S3_PUBLIC_BASE=https://minio.seudominio.com/barbershop
S3_PRESIGN_EXPIRES_SECONDS=900
UPLOAD_MAX_BYTES=10485760
```

---

## 3) Dependências

```bash
npm i @aws-sdk/client-s3 @aws-sdk/s3-request-presigner @fastify/multipart
```

---

## 4) Configuração do Cliente S3

`src/shared/storage/s3.ts`
```ts
import { S3Client } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY as string,
    secretAccessKey: process.env.S3_SECRET_KEY as string,
  },
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
});
```

---

## 5) Provider de Armazenamento

`src/shared/storage/IStorageProvider.ts`
```ts
export type PutParams = {
  key: string;
  contentType?: string;
  contentLength?: number;
  metadata?: Record<string, string>;
};

export interface IStorageProvider {
  getPublicUrl(key: string): string;
  getPresignedPutUrl(p: PutParams, expiresSec?: number): Promise<string>;
  getPresignedGetUrl(key: string, expiresSec?: number): Promise<string>;
  putObjectFromStream(p: PutParams, stream: NodeJS.ReadableStream): Promise<void>;
  deleteObject(key: string): Promise<void>;
}
```

`src/shared/storage/MinioStorageProvider.ts`
```ts
import { s3 } from "./s3";
import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { IStorageProvider, PutParams } from "./IStorageProvider";

const BUCKET = process.env.S3_BUCKET!;
const BASE = process.env.S3_PUBLIC_BASE;
const DEFAULT_EXP = Number(process.env.S3_PRESIGN_EXPIRES_SECONDS ?? 900);

export class MinioStorageProvider implements IStorageProvider {
  getPublicUrl(key: string) {
    return BASE ? `${BASE}/${encodeURIComponent(key)}` : "";
  }

  async getPresignedPutUrl(p: PutParams, expiresSec = DEFAULT_EXP) {
    const cmd = new PutObjectCommand({
      Bucket: BUCKET,
      Key: p.key,
      ContentType: p.contentType,
      Metadata: p.metadata,
    });
    return getSignedUrl(s3, cmd, { expiresIn: expiresSec });
  }

  async getPresignedGetUrl(key: string, expiresSec = DEFAULT_EXP) {
    const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    return getSignedUrl(s3, cmd, { expiresIn: expiresSec });
  }

  async putObjectFromStream(p: PutParams, stream: NodeJS.ReadableStream) {
    const cmd = new PutObjectCommand({
      Bucket: BUCKET,
      Key: p.key,
      Body: stream,
      ContentType: p.contentType,
      Metadata: p.metadata,
    });
    await s3.send(cmd);
  }

  async deleteObject(key: string) {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  }
}
```

---

## 6) Plugin do Fastify

`src/plugins/storage.ts`
```ts
import fp from "fastify-plugin";
import { MinioStorageProvider } from "@/shared/storage/MinioStorageProvider";

export default fp(async (app) => {
  const storage = new MinioStorageProvider();
  app.decorate("storage", storage);
});

declare module "fastify" {
  interface FastifyInstance {
    storage: import("@/shared/storage/IStorageProvider").IStorageProvider;
  }
}
```

---

## 7) Rotas de Upload

### Pré-assinar URL (recomendado)

`POST /files/presign`
```ts
const key = `${folder}/${crypto.randomUUID()}_${filename}`;
const url = await app.storage.getPresignedPutUrl({ key, contentType }, 900);
return { key, uploadUrl: url };
```

### Upload via servidor

- Use `@fastify/multipart`
- `await app.storage.putObjectFromStream({ key, contentType }, file.stream)`

---

## 8) Prisma: Campos Recomendados

Adicione ao schema:

```prisma
avatarKey        String?
avatarBucket     String?
avatarContentType String?
avatarSize       Int?
avatarEtag       String?
```

---

## 9) Segurança

- Bucket **privado** (use presigned GET)
- Valide `contentType` e tamanho antes do upload
- Limite com `UPLOAD_MAX_BYTES`

---

## 10) Migração de Arquivos Locais

1. Liste registros com caminho local.
2. Faça upload para MinIO.
3. Atualize os campos `key` no banco.
4. Remova arquivos locais após testes.

---

## 11) Testes

- Mock de S3 em testes unitários.
- Teste E2E com Insomnia ou Postman.
- Logue `key` e `size`, nunca segredos.

---

## 12) CI/CD

- Configure envs no EasyPanel.
- Confirme `NODE_ENV=production`.
- Sincronize horário da máquina.

---

## 13) Checklist

- [x] Instalar dependências
- [x] Criar cliente S3
- [x] Implementar provider MinIO
- [x] Plugin Fastify
- [x] Rotas de upload
- [x] Migration Prisma
- [x] Script de migração
- [x] Policies & lifecycle
- [x] Testes e documentação

---

## 14) Observações Finais

- `forcePathStyle` deve estar ativo para MinIO.
- Use Let’s Encrypt no EasyPanel.
- Prefira presigned PUT/GET ao invés de uploads diretos.
- Utilize Lifecycle para expirar uploads temporários.

// @ts-nocheck
import * as __fd_glob_17 from "../content/docs/api-references/temp-mail/messages.mdx?collection=docs"
import * as __fd_glob_16 from "../content/docs/api-references/temp-mail/index.mdx?collection=docs"
import * as __fd_glob_15 from "../content/docs/api-references/temp-mail/domains.mdx?collection=docs"
import * as __fd_glob_14 from "../content/docs/api-references/temp-mail/accounts.mdx?collection=docs"
import * as __fd_glob_13 from "../content/docs/api-references/index.mdx?collection=docs"
import * as __fd_glob_12 from "../content/docs/api-references/airdrop-v1.mdx?collection=docs"
import * as __fd_glob_11 from "../content/docs/api-references/ai-models.mdx?collection=docs"
import * as __fd_glob_10 from "../content/docs/authentication/sign-up.mdx?collection=docs"
import * as __fd_glob_9 from "../content/docs/authentication/login.mdx?collection=docs"
import * as __fd_glob_8 from "../content/docs/api-keys/index.mdx?collection=docs"
import * as __fd_glob_7 from "../content/docs/what-is-devora.mdx?collection=docs"
import * as __fd_glob_6 from "../content/docs/index.mdx?collection=docs"
import * as __fd_glob_5 from "../content/docs/get-started.mdx?collection=docs"
import { default as __fd_glob_4 } from "../content/docs/api-references/temp-mail/meta.json?collection=docs"
import { default as __fd_glob_3 } from "../content/docs/authentication/meta.json?collection=docs"
import { default as __fd_glob_2 } from "../content/docs/api-references/meta.json?collection=docs"
import { default as __fd_glob_1 } from "../content/docs/api-keys/meta.json?collection=docs"
import { default as __fd_glob_0 } from "../content/docs/meta.json?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.docs("docs", "content/docs", {"meta.json": __fd_glob_0, "api-keys/meta.json": __fd_glob_1, "api-references/meta.json": __fd_glob_2, "authentication/meta.json": __fd_glob_3, "api-references/temp-mail/meta.json": __fd_glob_4, }, {"get-started.mdx": __fd_glob_5, "index.mdx": __fd_glob_6, "what-is-devora.mdx": __fd_glob_7, "api-keys/index.mdx": __fd_glob_8, "authentication/login.mdx": __fd_glob_9, "authentication/sign-up.mdx": __fd_glob_10, "api-references/ai-models.mdx": __fd_glob_11, "api-references/airdrop-v1.mdx": __fd_glob_12, "api-references/index.mdx": __fd_glob_13, "api-references/temp-mail/accounts.mdx": __fd_glob_14, "api-references/temp-mail/domains.mdx": __fd_glob_15, "api-references/temp-mail/index.mdx": __fd_glob_16, "api-references/temp-mail/messages.mdx": __fd_glob_17, });
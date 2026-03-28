// @ts-nocheck
import * as __fd_glob_9 from "../content/docs/api-references/temp-mail/messages.mdx?collection=docs"
import * as __fd_glob_8 from "../content/docs/api-references/temp-mail/index.mdx?collection=docs"
import * as __fd_glob_7 from "../content/docs/api-references/temp-mail/accounts.mdx?collection=docs"
import * as __fd_glob_6 from "../content/docs/api-references/index.mdx?collection=docs"
import * as __fd_glob_5 from "../content/docs/api-keys/index.mdx?collection=docs"
import * as __fd_glob_4 from "../content/docs/index.mdx?collection=docs"
import { default as __fd_glob_3 } from "../content/docs/api-references/temp-mail/meta.json?collection=docs"
import { default as __fd_glob_2 } from "../content/docs/api-references/meta.json?collection=docs"
import { default as __fd_glob_1 } from "../content/docs/api-keys/meta.json?collection=docs"
import { default as __fd_glob_0 } from "../content/docs/meta.json?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.docs("docs", "content/docs", {"meta.json": __fd_glob_0, "api-keys/meta.json": __fd_glob_1, "api-references/meta.json": __fd_glob_2, "api-references/temp-mail/meta.json": __fd_glob_3, }, {"index.mdx": __fd_glob_4, "api-keys/index.mdx": __fd_glob_5, "api-references/index.mdx": __fd_glob_6, "api-references/temp-mail/accounts.mdx": __fd_glob_7, "api-references/temp-mail/index.mdx": __fd_glob_8, "api-references/temp-mail/messages.mdx": __fd_glob_9, });
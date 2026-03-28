// @ts-nocheck
import * as __fd_glob_4 from "../content/docs/temp-mail/index.mdx?collection=docs"
import * as __fd_glob_3 from "../content/docs/api-keys/index.mdx?collection=docs"
import * as __fd_glob_2 from "../content/docs/index.mdx?collection=docs"
import { default as __fd_glob_1 } from "../content/docs/temp-mail/meta.json?collection=docs"
import { default as __fd_glob_0 } from "../content/docs/api-keys/meta.json?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.docs("docs", "content/docs", {"api-keys/meta.json": __fd_glob_0, "temp-mail/meta.json": __fd_glob_1, }, {"index.mdx": __fd_glob_2, "api-keys/index.mdx": __fd_glob_3, "temp-mail/index.mdx": __fd_glob_4, });
import { readFiles } from '@johngw/fs'
import type { WithFileNamesResult } from '@johngw/fs/dist/readFiles'
import type { Data } from '@targetd/api'
import YAML from 'yaml'
import type { Keys } from 'ts-toolbelt/out/Any/Keys'
import {
  type infer as zInfer,
  array,
  object,
  strictObject,
  string,
  unknown,
  type ZodRawShape,
} from 'zod'

const FileData = object({ $schema: string().optional() }).catchall(
  strictObject({ rules: array(unknown()) }),
)

type FileData = zInfer<typeof FileData>

export async function load<
  DataParsers extends ZodRawShape,
  TargetingParsers extends ZodRawShape,
  QueryParsers extends ZodRawShape,
  FallThroughTargetingParsers extends ZodRawShape,
>(
  data: Data<
    DataParsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers
  >,
  dir: string,
) {
  for await (const contents of readFiles(dir, {
    encoding: 'utf8',
    filter: pathIsLoadable,
    withFileNames: true,
  })) {
    data = addRules(data, parseFileContents(contents))
  }

  return data
}

export function pathIsLoadable(path: string) {
  return (
    path.endsWith('.yaml') || path.endsWith('.yml') || path.endsWith('.json')
  )
}

function parseFileContents({
  fileName,
  contents,
}: WithFileNamesResult<string>) {
  return FileData.parse(
    fileName.endsWith('.json') ? JSON.parse(contents) : YAML.parse(contents),
  )
}

function addRules<
  DataParsers extends ZodRawShape,
  TargetingParsers extends ZodRawShape,
  QueryParsers extends ZodRawShape,
  FallThroughTargetingParsers extends ZodRawShape,
>(
  data: Data<
    DataParsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers
  >,
  fileData: FileData,
) {
  return Object.entries(fileData).reduce(
    (data, [name, value]) =>
      typeof value === 'object'
        ? data.addRules(name as Keys<DataParsers>, value.rules as any[])
        : data,
    data,
  )
}

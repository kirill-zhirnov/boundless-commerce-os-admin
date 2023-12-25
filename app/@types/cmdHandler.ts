import childProcess from 'child_process';

export interface ICmdHandler {
  run: () => Promise<unknown>
}

export enum CmdOptions {
  Import = 'import'
}

export enum ImportCmdActions {
  Run = 'run',
  Download = 'download'
}

type CmdActionsMap = {
  [CmdOptions.Import]: ImportCmdActions
}

type CmdActions = ImportCmdActions

export interface ICmdParameters {
  cmd: CmdOptions,
  import_id: number,
  action: CmdActions,
  options: childProcess.SpawnOptions
}

export interface ICmdParametersDefined<T extends keyof CmdActionsMap> extends ICmdParameters {
  cmd: T,
  action: CmdActionsMap[T],
}

export type IImportConstructorArgs = [number, number, childProcess.SpawnOptions]

import { IWireProfileModel, ITableConfig, ITableModel } from './schema';
export interface APIResponse {
    success: boolean;
    error?: string | null;
}
export interface TProfileCreatePostData {
    username: string;
    email: string;
    pin: string;
}
export interface TProfileCreateResponse extends APIResponse {
    profile?: IWireProfileModel;
}
export interface TLoginPostData {
    username: string;
    password: string;
}
export interface TLoginResponse extends APIResponse {
    profile: IWireProfileModel | null;
}
export interface TTableCreatePostData {
    config: ITableConfig;
}
export interface TTableCreateResponse extends APIResponse {
    table: ITableModel;
}
export interface TProfileResponse extends APIResponse {
    profile: IWireProfileModel;
}
export interface IActionSubmissionResponse {
}
export interface IGameInformationResponse {
}

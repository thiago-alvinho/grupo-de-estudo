import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'home': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'tracks.index': { paramsTuple?: []; params?: {} }
    'tracks.create': { paramsTuple?: []; params?: {} }
    'tracks.store': { paramsTuple?: []; params?: {} }
    'tracks.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tracks.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tracks.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tracks.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'lessons.store': { paramsTuple: [ParamValue]; params: {'trackId': ParamValue} }
    'lessons.update': { paramsTuple: [ParamValue,ParamValue]; params: {'trackId': ParamValue,'id': ParamValue} }
    'lessons.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'trackId': ParamValue,'id': ParamValue} }
    'lessons.toggle_progress': { paramsTuple: [ParamValue,ParamValue]; params: {'trackId': ParamValue,'id': ParamValue} }
    'session.destroy': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'home': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'tracks.index': { paramsTuple?: []; params?: {} }
    'tracks.create': { paramsTuple?: []; params?: {} }
    'tracks.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tracks.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'home': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'tracks.index': { paramsTuple?: []; params?: {} }
    'tracks.create': { paramsTuple?: []; params?: {} }
    'tracks.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tracks.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'tracks.store': { paramsTuple?: []; params?: {} }
    'lessons.store': { paramsTuple: [ParamValue]; params: {'trackId': ParamValue} }
    'lessons.toggle_progress': { paramsTuple: [ParamValue,ParamValue]; params: {'trackId': ParamValue,'id': ParamValue} }
    'session.destroy': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'tracks.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'lessons.update': { paramsTuple: [ParamValue,ParamValue]; params: {'trackId': ParamValue,'id': ParamValue} }
  }
  DELETE: {
    'tracks.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'lessons.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'trackId': ParamValue,'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}
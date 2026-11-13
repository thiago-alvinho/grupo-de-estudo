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
    'tracks.explore': { paramsTuple?: []; params?: {} }
    'tracks.create': { paramsTuple?: []; params?: {} }
    'tracks.store': { paramsTuple?: []; params?: {} }
    'tracks.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tracks.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tracks.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tracks.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tracks.join': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tracks.leave': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tracks.transfer_ownership': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tracks.unlock': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tracks.request_access': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tracks.members.approve': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'memberId': ParamValue} }
    'tracks.members.reject': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'memberId': ParamValue} }
    'tracks.members.remove': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'memberId': ParamValue} }
    'realtime.events': { paramsTuple?: []; params?: {} }
    'lessons.store': { paramsTuple: [ParamValue]; params: {'trackId': ParamValue} }
    'lessons.update': { paramsTuple: [ParamValue,ParamValue]; params: {'trackId': ParamValue,'id': ParamValue} }
    'lessons.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'trackId': ParamValue,'id': ParamValue} }
    'lessons.toggle_progress': { paramsTuple: [ParamValue,ParamValue]; params: {'trackId': ParamValue,'id': ParamValue} }
    'lessons.save_note': { paramsTuple: [ParamValue,ParamValue]; params: {'trackId': ParamValue,'id': ParamValue} }
    'videos.index': { paramsTuple?: []; params?: {} }
    'videos.create': { paramsTuple?: []; params?: {} }
    'videos.store': { paramsTuple?: []; params?: {} }
    'videos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.index': { paramsTuple?: []; params?: {} }
    'notifications.mark_all_read': { paramsTuple?: []; params?: {} }
    'notifications.mark_read': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'admin.users': { paramsTuple?: []; params?: {} }
    'admin.users.toggle_role': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.videos': { paramsTuple?: []; params?: {} }
    'admin.videos.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'home': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'tracks.index': { paramsTuple?: []; params?: {} }
    'tracks.explore': { paramsTuple?: []; params?: {} }
    'tracks.create': { paramsTuple?: []; params?: {} }
    'tracks.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tracks.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'realtime.events': { paramsTuple?: []; params?: {} }
    'videos.index': { paramsTuple?: []; params?: {} }
    'videos.create': { paramsTuple?: []; params?: {} }
    'videos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.index': { paramsTuple?: []; params?: {} }
    'admin.users': { paramsTuple?: []; params?: {} }
    'admin.videos': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'home': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'tracks.index': { paramsTuple?: []; params?: {} }
    'tracks.explore': { paramsTuple?: []; params?: {} }
    'tracks.create': { paramsTuple?: []; params?: {} }
    'tracks.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tracks.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'realtime.events': { paramsTuple?: []; params?: {} }
    'videos.index': { paramsTuple?: []; params?: {} }
    'videos.create': { paramsTuple?: []; params?: {} }
    'videos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'notifications.index': { paramsTuple?: []; params?: {} }
    'admin.users': { paramsTuple?: []; params?: {} }
    'admin.videos': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'tracks.store': { paramsTuple?: []; params?: {} }
    'tracks.join': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tracks.transfer_ownership': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tracks.unlock': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tracks.request_access': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tracks.members.approve': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'memberId': ParamValue} }
    'tracks.members.reject': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'memberId': ParamValue} }
    'lessons.store': { paramsTuple: [ParamValue]; params: {'trackId': ParamValue} }
    'lessons.toggle_progress': { paramsTuple: [ParamValue,ParamValue]; params: {'trackId': ParamValue,'id': ParamValue} }
    'lessons.save_note': { paramsTuple: [ParamValue,ParamValue]; params: {'trackId': ParamValue,'id': ParamValue} }
    'videos.store': { paramsTuple?: []; params?: {} }
    'notifications.mark_all_read': { paramsTuple?: []; params?: {} }
    'notifications.mark_read': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'admin.users.toggle_role': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PUT: {
    'tracks.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'lessons.update': { paramsTuple: [ParamValue,ParamValue]; params: {'trackId': ParamValue,'id': ParamValue} }
  }
  DELETE: {
    'tracks.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tracks.leave': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'tracks.members.remove': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'memberId': ParamValue} }
    'lessons.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'trackId': ParamValue,'id': ParamValue} }
    'notifications.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.videos.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}
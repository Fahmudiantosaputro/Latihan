/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(auth)` | `/(auth)/forgot` | `/(auth)/login` | `/(auth)/register` | `/(tabs)` | `/(tabs)/beranda` | `/(tabs)/laporan` | `/(tabs)/profil` | `/_sitemap` | `/beranda` | `/forgot` | `/laporan` | `/login` | `/profil` | `/register`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}

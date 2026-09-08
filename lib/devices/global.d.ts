/**
 * Global type augmentations for the experimental Web Bluetooth and Web Serial
 * APIs used by the Device Integration feature.
 *
 * These are intentionally minimal and scoped to the parts of the APIs the app
 * actually uses. If the TypeScript DOM lib starts shipping these types, this
 * augmentation can be removed.
 */

interface Navigator {
  bluetooth?: {
    requestDevice: (options: {
      acceptAllDevices?: boolean;
      optionalServices?: string[];
    }) => Promise<unknown>;
  };
  serial?: {
    getPorts: () => Promise<unknown>;
    requestPort: () => Promise<unknown>;
  };
}

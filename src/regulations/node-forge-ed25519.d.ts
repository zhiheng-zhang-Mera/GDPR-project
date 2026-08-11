declare module 'node-forge/lib/ed25519' {
  type Bytes = string | Uint8Array;
  const ed25519: {
    verify(options: { message: string; encoding: 'utf8'; signature: Bytes; publicKey: Bytes }): boolean;
    sign(options: { message: string; encoding: 'utf8'; privateKey: Bytes }): Uint8Array;
    generateKeyPair(options: { seed: Uint8Array }): { publicKey: Uint8Array; privateKey: Uint8Array };
  };
  export default ed25519;
}

declare module 'node-forge/lib/md' {
  const md: { sha256: { create(): { update(value: string, encoding: 'utf8' | 'raw'): { digest(): { toHex(): string } } } } };
  export default md;
}

declare module 'node-forge/lib/util' {
  const util: { decode64(value: string): string; encode64(value: string): string };
  export default util;
}

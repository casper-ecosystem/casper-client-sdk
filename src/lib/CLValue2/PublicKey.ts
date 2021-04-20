import { concat } from '@ethersproject/bytes';
import { Ok, Err } from "ts-results";

import { CLType, CLValue,
  CLErrorCodes,
  resultHelper,
  ResultAndRemainder,
  ToBytes,
  FromBytes,
} from './index';
import { PUBLIC_KEY_ID } from "./constants";
import { decodeBase16, encodeBase16 } from '../Conversions';
import { byteHash } from '../Contracts';

// TODO: Tidy up almost the same enum in 
// { SignatureAlgorithm } '../Keys';

export enum CLPublicKeyTag {
  ED25519 = 1,
  SECP256K1 = 2
}

export class CLPublicKeyType extends CLType {
  linksTo = CLPublicKey;

  toString(): string {
    return PUBLIC_KEY_ID;
  }

  toJSON(): string {
    return this.toString();
  }
}

export class CLPublicKey extends CLValue implements ToBytes, FromBytes {
  data: Uint8Array;
  private tag: CLPublicKeyTag;

  constructor(rawPublicKey: Uint8Array, tag: CLPublicKeyTag) {
    super();
    // TODO: Add length check
    if (Object.values(CLPublicKeyTag).includes(tag)) {
      this.data = rawPublicKey;
      this.tag = tag;
    } else {
      throw new Error('Unsupported type of public key');
    }
  }

  clType(): CLType {
    return new CLPublicKeyType();
  }

  toAccountHex(): string {
    return `0${this.tag}${encodeBase16(this.data)}`;
  }

  isEd25519(): boolean {
    return this.tag === CLPublicKeyTag.ED25519;
  }

  isSecp256K1(): boolean {
    return this.tag === CLPublicKeyTag.SECP256K1;
  }

  // TBD - Maybe it should return hexstring?
  toAccountHash(): Uint8Array {
    const algorithmIdentifier = CLPublicKeyTag[this.tag];
    const separator = Uint8Array.from([0]);
    const prefix = concat([
      new TextEncoder().encode(algorithmIdentifier.toLowerCase()),
      separator
    ]);

    // TBD: Does it make sense or should we throw an error?
    if (this.data.length === 0) {
      return Uint8Array.from([]);
    } else {
      return byteHash(concat([prefix, this.data]));
    }
  }

  value(): Uint8Array {
    return this.data;
  }

  static fromEd25519(publicKey: Uint8Array): CLPublicKey {
    return new CLPublicKey(publicKey, CLPublicKeyTag.ED25519);
  }

  static fromSecp256K1(publicKey: Uint8Array): CLPublicKey {
    return new CLPublicKey(publicKey, CLPublicKeyTag.SECP256K1);
  }

  /**
   * Tries to decode PublicKey from its hex-representation.
   * The hex format should be as produced by PublicKey.toAccountHex
   * @param publicKeyHex
   */
  static fromHex(publicKeyHex: string): CLPublicKey {
    if (publicKeyHex.length < 2) {
      throw new Error('Asymmetric key error: too short');
    }
    const publicKeyHexBytes = decodeBase16(publicKeyHex);

    return new CLPublicKey(publicKeyHexBytes.subarray(1), publicKeyHexBytes[0]);
  }

  public toBytes(): Uint8Array {
    return concat([
      Uint8Array.from([this.tag]),
      this.data
    ]);
  }

  static fromBytes(
    rawBytes: Uint8Array,
  ): ResultAndRemainder<CLPublicKey, CLErrorCodes> {
    if (rawBytes.length < 1) {
      return resultHelper(Err(CLErrorCodes.EarlyEndOfStream));
    }

    const variant = rawBytes[0];

    let expectedPublicKeySize;
    if (variant === CLPublicKeyTag.ED25519) { 
      expectedPublicKeySize = 32;
    } else if (variant === CLPublicKeyTag.SECP256K1) { 
      expectedPublicKeySize = 33;
    } else {
      return resultHelper(Err(CLErrorCodes.Formatting));
    }

    const bytes = rawBytes.subarray(1, expectedPublicKeySize + 1);

    const publicKey = new CLPublicKey(bytes, variant);

    return resultHelper(Ok(publicKey), rawBytes.subarray(expectedPublicKeySize + 1));
  }

}
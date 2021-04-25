import { expect } from 'chai';
import { CLBool, CLErrorCodes } from './index';

describe('CLBool', () => {
  it('Bool should return proper clType', () => {
    const myBool = new CLBool(false);
    const clType = myBool.clType();
    expect(clType.toString()).to.be.eq("Bool");
  });

  it('Should be able to return proper value by calling .value()', () => {
    const myBool = new CLBool(false);
    const myBool2 = new CLBool(true);

    expect(myBool.value()).to.be.eq(false);
    expect(myBool2.value()).to.be.eq(true);
  });

  it('toBytes() / fromBytes() do proper bytes serialization', () => {
    const myBool = new CLBool(false);
    const myBool2 = new CLBool(true);
    const myBoolBytes = myBool.toBytes().unwrap();
    const myBool2Bytes = myBool2.toBytes().unwrap();

    const fromBytes1 = CLBool.fromBytes(myBoolBytes).unwrap();
    const fromBytes2 = CLBool.fromBytes(myBool2Bytes).unwrap();

    expect(myBoolBytes).to.be.deep.eq(Uint8Array.from([0]));
    expect(myBool2Bytes).to.be.deep.eq(Uint8Array.from([1]));

    expect(fromBytes1).to.be.deep.eq(myBool);
    expect(fromBytes2).to.be.deep.eq(myBool2);
    expect(CLBool.fromBytes(Uint8Array.from([9, 1])).ok).to.be.eq(false);
    expect(CLBool.fromBytes(Uint8Array.from([9, 1])).val).to.be.eq(CLErrorCodes.Formatting);
    expect(CLBool.fromBytes(Uint8Array.from([])).ok).to.be.eq(false);
    expect(CLBool.fromBytes(Uint8Array.from([])).val).to.be.eq(CLErrorCodes.EarlyEndOfStream);
  });


  it('toJSON() / fromJSON() do proper bytes serialization', () => {
    const myBool = new CLBool(false);
    const json = myBool.toJSON().unwrap();
    const expectedJson = JSON.parse('{"bytes":"00","cl_type":"Bool"}');

    expect(json).to.be.deep.eq(expectedJson);
    expect(CLBool.fromJSON(expectedJson).unwrap()).to.be.deep.eq(myBool);
  });
});
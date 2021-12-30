import React, { useState, useEffect, useContext } from 'react';
import { Button, Checkbox, Input, Spin } from 'antd';
import './style.scss'
import images from 'src/Configs/images';
import AppContext from 'src/Context/AppContext';
import Web3 from 'web3'

const TYPE_MULTI = {
  NONE: 'none',
  FOR: 'for',
  ARRAY: 'array'
}

const Automatic = () => {
  const [app] = useContext(AppContext)
  const { isDarkMode } = app

  const [abiJson, setAbiJson] = useState('')
  const [abi, setAbi] = useState(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [inputs, setInputs] = useState({})
  const [error, setError] = useState(null)

  useEffect(() => {
    if (error) {
      setTimeout(() => setError(null), 3000)
    }
  }, [error])

  const handleChangeAbi = (e) => {
    const newAbi = e.target.value.toString()
    setAbiJson(newAbi)
    if (newAbi === '') {
      setAbi(null)
    }
    if (newAbi.startsWith(`{`) && newAbi.endsWith(`}`) && newAbi.includes(`"name"`) && newAbi.includes(`"inputs"`) && newAbi.includes(`"outputs"`) && newAbi.includes(`"function"`)) {
      handleDetectABI(newAbi)
    }
  }

  const handleDetectABI = (abi) => {
    setLoading(true)
    setTimeout(() => setLoading(false), 3000)
    const abiObj = JSON.parse(abi)
    setAbi(abiObj)
  }

  const run = async () => {
    const cloneObjInputs = { ...inputs }
    let objMulti = {}
    let objNotMulti = {}
    let arrMultil = abi.inputs.map((item) => {
      if (cloneObjInputs[item.name].isMulti) {
        objMulti[item.name] = cloneObjInputs[item.name]
        return { ...cloneObjInputs[item.name], name: item.name}
      }
      return null
    })
    arrMultil = arrMultil.filter(item => item !== null)
    
    let arrNotMultil = abi.inputs.map((item) => {
      if (!cloneObjInputs[item.name].isMulti) {
        objNotMulti[item.name] = cloneObjInputs[item.name]
        return { ...cloneObjInputs[item.name], name: item.name}
      }
      return null
    })
    arrNotMultil = arrNotMultil.filter(item => item !== null)

    let typeMulti = TYPE_MULTI.NONE
    let errorMulti = null
    if (arrMultil.length > 0) {
      if (arrMultil[0].value.includes('=>')) {
        typeMulti = TYPE_MULTI.FOR
        if (arrMultil.length > 1) {
          errorMulti = 'Error: Multiple type.'
        }
      } else {
        typeMulti = TYPE_MULTI.ARRAY
        arrMultil.map((item) => {
          if (!item?.value?.startsWith('[') || !item.value.endsWith(']')) {
            errorMulti = 'Error: Multiple type.'
          }
        })
      }
    }

    if (errorMulti) {
      setError(errorMulti)
      return
    }

    console.log(typeMulti)
    console.log(arrMultil)

    if (typeMulti === TYPE_MULTI.FOR) {
      const [from, to] = arrMultil[0].value.split('=>')
      for (let i = Number(from); i < Number(to); i++) {
        const params = abi.inputs.map((item) => {
          if (objNotMulti[item.name]){
            return objNotMulti[item.name].value
          } else {
            return i
          }
        })
        runTransaction(inputs.addressContract.value, inputs.privateKey.value, params)
      }
    }
  }
  const runTransaction = async (address, privateKey, params) => {
    console.log(address, privateKey)
    console.log(params)
    // const web3 = new Web3()
    // web3.setProvider(new Web3.providers.HttpProvider('https://rpc.testnet.tomochain.com'))
    // const contract = new web3.eth.Contract(abi, '0x6347809d6a907da7eab615dec646a36a3fc2fdef')
  }

  const renderStep1 = () => {
    return (
      <>
       <div className='input-wrapper MT10'>
          <p className='title'>Contract Address: </p>
          <Input disabled={loading} className='input MT5' placeholder='{ "name": ... }' value={abiJson} onChange={handleChangeAbi} />
        </div>
       <div className='input-wrapper MT10'>
          <p className='title'>Min ABI: </p>
          <Input disabled={loading} className='input MT5' placeholder='{ "name": ... }' value={abiJson} onChange={handleChangeAbi} />
        </div>
        {loading && <img width={isDarkMode ? 40 : 70} alt='loading' className='MT15 loading' src={isDarkMode ? images.icLoadingDark : images.icLoading} />}
        {
          !loading && abi && <>
            <p className='info MT20'>Function name: {abi?.name}</p>
            <Button onClick={() => setStep(2)} className='btn MT20'>Next Step</Button>
          </>
        }
      </>
    )
  }

  const onChangeInputs = (name, value) => {
    const newInput = { ...inputs }
    newInput[name] = newInput[name] ? { ...newInput[name], ...value } : { isMulti: false, value: '', ...value }
    setInputs(newInput)
  }

  const renderStep2 = () => {
    return (
      <>
        <div className='input-wrapper MT15'>
          <div className='title-wrapper'>
            <p className='title'>Address contract: </p>
          </div>
          <Input value={inputs?.addressContract ? inputs.addressContract.value : ''} onChange={(e) => onChangeInputs('addressContract', { value: e.target.value })} className='input MT5'/>
        </div>
        <div className='input-wrapper MT15'>
          <div className='title-wrapper'>
            <p className='title'>Private key: </p>
          </div>
          <Input value={inputs?.privateKey ? inputs.privateKey.value : ''} onChange={(e) => onChangeInputs('privateKey', { value: e.target.value })} className='input MT5'/>
        </div>
        {
          abi.inputs.map((item) => {
            return (
              <div className='input-wrapper MT15' key={item.name}>
                <div className='title-wrapper'>
                  <p className='title'>{item.name}: </p> <Checkbox checked={inputs[item.name] ? inputs[item.name].isMulti : false} onChange={(e) => onChangeInputs(item.name, { isMulti: e.target.checked })} /> <span className='multi'>Multilple</span>
                </div>
                <Input value={inputs[item.name] ? inputs[item.name].value : ''} onChange={(e) => onChangeInputs(item.name, { value: e.target.value })} className='input MT5'/>
              </div>
            )
          })
        }
        <div className='btn-wrapper MT20'>
          <Button disabled={loading} onClick={() => setStep(1)} className='btn'>Prev Step</Button>
          <Button loading={loading} disabled={abi && abi?.inputs?.length + 2 !== Object.keys(inputs).length} onClick={run} className='btn ML15'>Run</Button>
        </div>
      </>
    )
  }

  return (
    <div className='automatic-container'>
      <h2 className='title'>Automatic (TOMO)</h2>
      {step === 1 && renderStep1()}
      {step === 2 && abi && renderStep2()}
      {error && <h3 className='text-error'>{error}</h3>}
    </div>
  );
};

export default Automatic;
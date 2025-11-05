import { Oval } from 'react-loader-spinner'

function LoadingGen({ mensagem }) {
  return (
    <div className='h-screen w-full flex flex-col gap-10 justify-center items-center'>
        <Oval
            visible={true}
            height="80"
            width="80"
            color="#5A2779"
            ariaLabel="oval-loading"
            secondaryColor="#C084FC"
            wrapperStyle={{}}
            wrapperClass=""
        />
        <p className='text-center text-apollo-200 font-bold'>{mensagem}</p>
    </div>
  )
}

export default LoadingGen
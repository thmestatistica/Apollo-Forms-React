import { Oval } from 'react-loader-spinner'

function LoadingGen({ mensagem, primaryColor, secondaryColor, messageColor }) {
  return (
    <div className='h-screen w-full flex flex-col gap-10 justify-center items-center'>
        <Oval
            visible={true}
            height="80"
            width="80"
            color={primaryColor || "#5A2779"}
            ariaLabel="oval-loading"
            secondaryColor={secondaryColor || "#C084FC"}
            wrapperStyle={{}}
            wrapperClass=""
        />
        <p className={`text-center ${messageColor || 'text-apollo-200'} font-bold`}>{mensagem}</p>
    </div>
  )
}

export default LoadingGen

import '../App.css'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { ScrollArea } from '../components/ui/scroll-area'
import { InstagramLogoIcon, FacebookLogoIcon } from '@phosphor-icons/react'

function Pupil() {
  return (
    <ScrollArea className="w-full h-dvh bg-border">
      <div className="flex flex-col h-full min-h-dvh w-full">
        <div className="w-full bg-border mt-0 mb-2 sm:mb-4 md:mb-6">
          <Card className="w-full flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16 p-4 sm:p-6">
            <div className="flex flex-col items-center justify-start h-full">
              <p className="font-konkhmer-sleokchher font-400 text-lg font-normal whitespace-nowrap">Um site:</p>
              <div className="flex flex-row items-center justify-center md:justify-start h-full gap-3 mt-2">
                <img src="https://i.ibb.co/C37cbVFf/image.png" className="h-14 sm:h-16 w-auto object-contain" />
                <img src="https://bit.ly/partnership-logo-2" className="h-10 sm:h-12 w-auto object-contain" />
              </div>
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <h1 className="text-3xl sm:text-4xl font-normal font-konkhmer-sleokchher font-400 whitespace-nowrap">Jornal Memória</h1>
              <h2 className="text-xl sm:text-2xl font-normal font-la-belle-aurore font-400">Tempo em letras</h2>
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <p className="font-konkhmer-sleokchher font-400 text-lg font-normal whitespace-nowrap">Acesse nossas redes sociais:</p>
              <div className="flex flex-row items-center justify-center md:justify-end h-full gap-3 mt-2">
                <a className="text-4xl sm:text-5xl" href="https://www.facebook.com/cpfundamentalemedio/"><FacebookLogoIcon className="text-5xl sm:text-6xl" /></a>
                <a className="text-4xl sm:text-5xl" href="https://www.instagram.com/colegiopresbiterianomackenzie/"><InstagramLogoIcon className="text-5xl sm:text-6xl" /></a>
              </div>
            </div>
          </Card>
        </div>
        <div className="flex flex-1 w-full items-start justify-start ml-8! bg-border font-konkhmer-sleokchher font-400 font-normal p-0">
          <div className="flex flex-col flex-1 w-full items-start justify-start ml-8! bg-border font-konkhmer-sleokchher font-400 font-normal p-0">
            <Card className="flex flex-col items-center justify-center shadow-accent-foreground shadow-md w-full max-w-7xl p-2 sm:p-3 m-0 rounded-md">
              <div className="flex flex-row items-center justify-end w-full max-w-2.5xl p-2 sm:p-3 m-0">
                <div className="flex flex-col flex-1 w-full items-start justify-center ml-8! font-konkhmer-sleokchher font-400 font-normal p-0"> 
                  <h1 className="text-xl text-left sm:text-2xl md:text-4xl">Notícias do grupo </h1>
                </div>
                <Button className="w-20 h-10 bg-amber-600 hover:bg-amber-700 text-accent-foreground rounded-md text-base sm:text-lg">Sair</Button>
              </div> 
            </Card>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}

export default Pupil

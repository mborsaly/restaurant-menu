export default function LoadingScreen({ message = "Loading..." }) {
  return (
    <div className="min-h-screen flex flex-col items-center 
                    justify-center bg-white">
      <div className="text-5xl mb-4 animate-bounce">🍕</div>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  )
}

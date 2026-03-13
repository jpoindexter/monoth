import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export function Landing() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground gap-4">
      <h1 className="text-4xl font-bold">Monoth</h1>
      <p className="text-muted-foreground text-lg">Free market intelligence for everyone</p>
      <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
    </div>
  )
}

import { ThemeProvider } from '@/components/theme-provider'
import { ModeToggle } from '@/components/mode-toggle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <div className="min-h-screen bg-background text-foreground p-8">
        <div className="flex justify-end mb-4">
          <ModeToggle />
        </div>
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Monoth</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Finance dashboard coming soon.</p>
            <Button className="mt-4">Get Started</Button>
          </CardContent>
        </Card>
      </div>
    </ThemeProvider>
  )
}

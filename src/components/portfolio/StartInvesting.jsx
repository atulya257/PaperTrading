import Button from '../ui/Button.jsx'
import Card from '../ui/Card.jsx'
import EmptyState from '../ui/EmptyState.jsx'

export default function StartInvesting() {
  return (
    <Card>
      <EmptyState
        title="You do not hold any stocks yet"
        action={
          <Button to="/markets" size="lg">
            Explore markets
          </Button>
        }
      />
    </Card>
  )
}

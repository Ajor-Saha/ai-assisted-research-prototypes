import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface TermTestSelectorProps {
  selectedTerm: string
  onTermChange: (term: string) => void
}

export function TermTestSelector({ selectedTerm, onTermChange }: TermTestSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">
        Target Assessment:
      </span>
      <Select value={selectedTerm} onValueChange={onTermChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Term Test" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">
            <div className="flex items-center justify-between w-full gap-2">
              <span>Term Test 1</span>
              <Badge variant="secondary" className="text-xs">Month 1-2</Badge>
            </div>
          </SelectItem>
          <SelectItem value="2">
            <div className="flex items-center justify-between w-full gap-2">
              <span>Term Test 2</span>
              <Badge variant="secondary" className="text-xs">Month 3-4</Badge>
            </div>
          </SelectItem>
          <SelectItem value="3">
            <div className="flex items-center justify-between w-full gap-2">
              <span>Term Test 3</span>
              <Badge variant="secondary" className="text-xs">Finals</Badge>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Check, HelpCircle } from 'lucide-react';

interface VoteOption {
  label: string;
  votes: number;
}

interface TeamVotingProps {
  question: string;
  options: VoteOption[];
  totalMembers: number;
  hasVoted: boolean;
  onVote: (optionIndex: number) => void;
  onClose?: () => void;
  isHost: boolean;
}

export function TeamVoting({
  question,
  options,
  totalMembers,
  hasVoted,
  onVote,
  onClose,
  isHost,
}: TeamVotingProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0);

  const handleVote = () => {
    if (selectedOption !== null && !hasVoted) {
      onVote(selectedOption);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-2">
          <HelpCircle className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <CardTitle className="text-base">Team Decision</CardTitle>
            <CardDescription className="mt-1">{question}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasVoted ? (
          // Show results
          <div className="space-y-3">
            {options.map((option, index) => {
              const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
              const isWinning = option.votes === Math.max(...options.map((o) => o.votes)) && option.votes > 0;
              
              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className={isWinning ? 'font-medium' : ''}>
                      {option.label}
                      {isWinning && <Check className="inline h-4 w-4 ml-1 text-primary" />}
                    </span>
                    <span className="text-muted-foreground">
                      {option.votes} vote{option.votes !== 1 ? 's' : ''} ({Math.round(percentage)}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
            <p className="text-xs text-muted-foreground text-center pt-2">
              {totalVotes} of {totalMembers} members voted
            </p>
            {isHost && onClose && (
              <Button onClick={onClose} variant="outline" size="sm" className="w-full">
                Close Vote
              </Button>
            )}
          </div>
        ) : (
          // Show voting options
          <div className="space-y-4">
            <RadioGroup
              value={selectedOption?.toString()}
              onValueChange={(val) => setSelectedOption(parseInt(val))}
            >
              {options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <Button
              onClick={handleVote}
              disabled={selectedOption === null}
              className="w-full"
            >
              Submit Vote
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

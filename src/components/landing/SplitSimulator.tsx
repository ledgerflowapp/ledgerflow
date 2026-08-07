'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useSplitCalculator, SplitType } from '@/hooks/finance/useSplitCalculator';
import { GroupMember } from '@/types';
import { cn } from '@/lib/utils';

// Mock group members to use for landing page simulation
const MOCK_MEMBERS: GroupMember[] = [
  { id: '1', name: 'Alice', user_id: 'alice_id', ghost_name: 'Alice', created_at: new Date() },
  { id: '2', name: 'Bob', user_id: 'bob_id', ghost_name: 'Bob', created_at: new Date() },
  { id: '3', name: 'Charlie', user_id: 'charlie_id', ghost_name: 'Charlie', created_at: new Date() },
];

export function SplitSimulator() {
  const [totalAmountInput, setTotalAmountInput] = useState<string>('300');
  const [payerId, setPayerId] = useState<string>('1');

  const parsedAmount = parseFloat(totalAmountInput) || 0;

  // Utilize the hook already present in the codebase
  const {
    splitType,
    setSplitType,
    shares,
    updateShare,
    selectedMembers,
    toggleMemberSelection,
    allocations,
    isValid,
    remainder,
  } = useSplitCalculator({
    totalAmount: parsedAmount,
    members: MOCK_MEMBERS,
    currentUserId: 'alice_id', // Mock active user
  });

  const selectedMembersSet = useMemo(() => new Set(selectedMembers), [selectedMembers]);
  const allocationsMap = useMemo(() => new Map(allocations.map(a => [a.memberId, a])), [allocations]);

  const payerName = MOCK_MEMBERS.find(m => m.id === payerId)?.name || 'Alice';

  return (
    <Card className="p-6 max-w-lg mx-auto border border-border shadow-md bg-card text-left space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-foreground">Interactive Split Simulator</h3>
        <p className="text-xs text-muted-foreground">
          See group calculations run instantly in Rupees. Switch modes to view mathematical allocations.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="total-amount" className="text-xs font-semibold">Total Cost (₹)</Label>
          <Input
            id="total-amount"
            type="number"
            min="0"
            className="h-9"
            placeholder="300"
            value={totalAmountInput}
            onChange={(e) => setTotalAmountInput(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="paid-by" className="text-xs font-semibold">Paid By</Label>
          <select
            id="paid-by"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
            value={payerId}
            onChange={(e) => setPayerId(e.target.value)}
          >
            {MOCK_MEMBERS.map(m => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Tabs
        defaultValue="EQUALLY"
        value={splitType}
        onValueChange={(v) => setSplitType(v as SplitType)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 h-9">
          <TabsTrigger value="EQUALLY" className="text-xs">Equal (=)</TabsTrigger>
          <TabsTrigger value="BY_AMOUNT" className="text-xs">Exact (₹)</TabsTrigger>
          <TabsTrigger value="BY_PERCENTAGE" className="text-xs">Percent (%)</TabsTrigger>
        </TabsList>

        {/* EQUALLY SPLIT */}
        <TabsContent value="EQUALLY" className="space-y-3 pt-2">
          <p className="text-[11px] text-muted-foreground">
            Split equally among selected active members. Click to toggle.
          </p>
          <div className="space-y-2">
            {MOCK_MEMBERS.map(member => {
              const isSelected = selectedMembersSet.has(member.id);
              const allocation = allocationsMap.get(member.id);
              const isPayer = member.id === payerId;

              return (
                <div
                  key={member.id}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg border transition-colors cursor-pointer",
                    isSelected ? "bg-muted/40 border-border" : "opacity-50 border-transparent bg-transparent"
                  )}
                  onClick={() => toggleMemberSelection(member.id)}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[10px] font-bold">
                        {member.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-foreground">{member.name}</p>
                      {isPayer && <span className="text-[9px] text-primary font-bold">Payer</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">
                      ₹{isSelected && allocation ? allocation.amountOwed.toFixed(2) : '0.00'}
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      {isSelected ? '33.3%' : 'Excluded'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* BY AMOUNT */}
        <TabsContent value="BY_AMOUNT" className="space-y-3 pt-2">
          <p className="text-[11px] text-muted-foreground">
            Enter exact rupees for each member. Sum must equal total.
          </p>
          <div className="space-y-2">
            {MOCK_MEMBERS.map(member => {
              const isPayer = member.id === payerId;
              return (
                <div key={member.id} className="flex items-center justify-between p-2 rounded-lg border border-border bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[10px] font-bold">
                        {member.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-foreground">{member.name}</p>
                      {isPayer && <span className="text-[9px] text-primary font-bold">Payer</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      placeholder="0"
                      className="w-20 h-7 text-right text-xs"
                      value={shares[member.id] || ''}
                      onChange={(e) => updateShare(member.id, parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className={cn("text-center text-xs font-semibold py-1 rounded", isValid ? "text-emerald-600 bg-emerald-500/5" : "text-rose-500 bg-rose-500/5")}>
            {isValid ? "Amounts match total successfully" : `Diff to match: ₹${remainder.toFixed(2)}`}
          </div>
        </TabsContent>

        {/* BY PERCENTAGE */}
        <TabsContent value="BY_PERCENTAGE" className="space-y-3 pt-2">
          <p className="text-[11px] text-muted-foreground">
            Enter percentage shares. Total percentage must equal 100%.
          </p>
          <div className="space-y-2">
            {MOCK_MEMBERS.map(member => {
              const isPayer = member.id === payerId;
              const allocation = allocationsMap.get(member.id);
              return (
                <div key={member.id} className="flex items-center justify-between p-2 rounded-lg border border-border bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[10px] font-bold">
                        {member.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-foreground">{member.name}</p>
                      {isPayer && <span className="text-[9px] text-primary font-bold">Payer</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xs font-bold text-foreground">
                      ₹{allocation ? allocation.amountOwed.toFixed(2) : '0.00'}
                    </p>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        placeholder="0"
                        className="w-16 h-7 text-right text-xs"
                        value={shares[member.id] || ''}
                        onChange={(e) => updateShare(member.id, parseFloat(e.target.value) || 0)}
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className={cn("text-center text-xs font-semibold py-1 rounded", isValid ? "text-emerald-600 bg-emerald-500/5" : "text-rose-500 bg-rose-500/5")}>
            {isValid ? "Percentages equal 100%" : `Remaining percent: ${remainder.toFixed(1)}%`}
          </div>
        </TabsContent>
      </Tabs>

      {/* Debt Summary visualization */}
      {isValid && parsedAmount > 0 && (
        <div className="pt-3 border-t border-border space-y-2">
          <p className="text-xs font-bold text-foreground uppercase tracking-wider">Settlement Calculation Results</p>
          <div className="space-y-1.5">
            {allocations.map(a => {
              const isPayer = a.memberId === payerId;
              const name = MOCK_MEMBERS.find(m => m.id === a.memberId)?.name || '';
              if (isPayer) {
                const getAmount = parsedAmount - a.amountOwed;
                return getAmount > 0 ? (
                  <p key={a.memberId} className="text-xs text-emerald-600 font-medium">
                    {name} paid ₹{parsedAmount.toFixed(2)} and gets back <strong className="font-bold">₹{getAmount.toFixed(2)}</strong> in total from the group.
                  </p>
                ) : (
                  <p key={a.memberId} className="text-xs text-muted-foreground font-medium">
                    {name} paid and owes no outstanding group balance.
                  </p>
                );
              } else {
                return a.amountOwed > 0 ? (
                  <p key={a.memberId} className="text-xs text-rose-600 font-medium">
                    {name} owes <strong className="font-bold">₹{a.amountOwed.toFixed(2)}</strong> directly to {payerName}.
                  </p>
                ) : null;
              }
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

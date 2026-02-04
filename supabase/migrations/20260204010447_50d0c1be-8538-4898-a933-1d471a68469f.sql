-- Create table for PDF statement/faturas (credit card statements)
CREATE TABLE public.pdf_statements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period_month INTEGER NOT NULL CHECK (period_month >= 1 AND period_month <= 12),
  period_year INTEGER NOT NULL CHECK (period_year >= 2000 AND period_year <= 2100),
  total_value NUMERIC NOT NULL,
  calculated_total NUMERIC DEFAULT 0,
  difference NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'em_analise' CHECK (status IN ('em_analise', 'batida', 'divergente')),
  pdf_url TEXT,
  raw_pdf_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_month, period_year)
);

-- Create table for expenses extracted from PDF statements
CREATE TABLE public.pdf_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  statement_id UUID NOT NULL REFERENCES public.pdf_statements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  description TEXT NOT NULL,
  value NUMERIC NOT NULL,
  expense_date DATE,
  type TEXT NOT NULL DEFAULT 'pdf_fatura',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.pdf_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pdf_statements
CREATE POLICY "Users can view own statements" 
ON public.pdf_statements 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own statements" 
ON public.pdf_statements 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own statements" 
ON public.pdf_statements 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all statements" 
ON public.pdf_statements 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all statements" 
ON public.pdf_statements 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for pdf_expenses
CREATE POLICY "Users can view own expenses" 
ON public.pdf_expenses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses" 
ON public.pdf_expenses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses" 
ON public.pdf_expenses 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses" 
ON public.pdf_expenses 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all expenses" 
ON public.pdf_expenses 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updating updated_at
CREATE TRIGGER update_pdf_statements_updated_at
BEFORE UPDATE ON public.pdf_statements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pdf_expenses_updated_at
BEFORE UPDATE ON public.pdf_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to recalculate statement totals
CREATE OR REPLACE FUNCTION public.recalculate_statement_total(statement_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calc_total NUMERIC;
  stmt_total NUMERIC;
  diff NUMERIC;
  new_status TEXT;
BEGIN
  -- Sum all expenses for this statement
  SELECT COALESCE(SUM(value), 0) INTO calc_total
  FROM public.pdf_expenses
  WHERE statement_id = statement_uuid;
  
  -- Get the statement's declared total
  SELECT total_value INTO stmt_total
  FROM public.pdf_statements
  WHERE id = statement_uuid;
  
  -- Calculate difference
  diff := stmt_total - calc_total;
  
  -- Determine status
  IF ABS(diff) < 0.01 THEN
    new_status := 'batida';
  ELSE
    new_status := 'divergente';
  END IF;
  
  -- Update the statement
  UPDATE public.pdf_statements
  SET calculated_total = calc_total,
      difference = diff,
      status = new_status,
      updated_at = now()
  WHERE id = statement_uuid;
END;
$$;

-- Trigger function to auto-recalculate on expense changes
CREATE OR REPLACE FUNCTION public.trigger_recalculate_statement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_statement_total(OLD.statement_id);
    RETURN OLD;
  ELSE
    PERFORM public.recalculate_statement_total(NEW.statement_id);
    RETURN NEW;
  END IF;
END;
$$;

-- Trigger to recalculate statement when expenses change
CREATE TRIGGER recalculate_on_expense_change
AFTER INSERT OR UPDATE OR DELETE ON public.pdf_expenses
FOR EACH ROW
EXECUTE FUNCTION public.trigger_recalculate_statement();
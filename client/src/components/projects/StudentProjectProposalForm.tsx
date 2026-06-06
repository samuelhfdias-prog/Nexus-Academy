/**
 * Student Project Proposal Form
 * Form para alunos proporem novos projetos
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { Plus, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { THEMATIC_AREAS } from "@shared/const";

interface StudentProjectProposalFormProps {
  onSuccess?: () => void;
  compact?: boolean;
}

export function StudentProjectProposalForm({
  onSuccess,
  compact = false,
}: StudentProjectProposalFormProps) {
  const [, navigate] = useLocation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thematicArea, setThematicArea] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [suggestedMaxMembers, setSuggestedMaxMembers] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMutation = trpc.studentProjects.create.useMutation({
    onSuccess: () => {
      toast.success("Proposta de projeto criada com sucesso! Você pode editá-la antes de submetê-la.");
      resetForm();
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao criar proposta");
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setThematicArea("");
    setTagInput("");
    setTags([]);
    setSuggestedMaxMembers(5);
  };

  const handleAddTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async () => {
    // Validations
    if (!title.trim() || title.length < 3) {
      toast.error("Título deve ter no mínimo 3 caracteres");
      return;
    }
    if (!description.trim() || description.length < 10) {
      toast.error("Descrição deve ter no mínimo 10 caracteres");
      return;
    }
    if (!thematicArea) {
      toast.error("Selecione uma área temática");
      return;
    }

    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync({
        title,
        description,
        thematicArea,
        tags,
        suggestedMaxMembers,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (compact) {
    return (
      <Card className="p-6 border-2 border-dashed border-blue-300 bg-blue-50/50">
        <div className="text-center space-y-4">
          <h3 className="font-700 text-lg text-gray-900">
            Tem uma ideia de projeto?
          </h3>
          <p className="text-sm text-gray-600">
            Proponha um novo projeto e um professor poderá aprová-lo para a plataforma.
          </p>
          <Button
            onClick={() => navigate("/meus-projetos/propor")}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Propor Projeto
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Alert className="border-blue-200 bg-blue-50">
        <Send className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          Preencha o formulário abaixo para propor um novo projeto. Sua proposta será
          revisada por um professor que poderá aprová-la ou pedir melhorias.
        </AlertDescription>
      </Alert>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="font-600">
            Título do Projeto
          </Label>
          <Input
            id="title"
            placeholder="Ex: Sistema de Recomendação de IA para E-commerce"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={255}
            className="rounded-lg"
          />
          <p className="text-xs text-gray-500">{title.length}/255 caracteres</p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="font-600">
            Descrição
          </Label>
          <Textarea
            id="description"
            placeholder="Descreva detalhadamente sua ideia de projeto, objetivos e possíveis impactos..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={5000}
            rows={6}
            className="rounded-lg resize-none"
          />
          <p className="text-xs text-gray-500">
            {description.length}/5000 caracteres (mínimo 10)
          </p>
        </div>

        {/* Thematic Area */}
        <div className="space-y-2">
          <Label htmlFor="area" className="font-600">
            Área Temática
          </Label>
          <Select value={thematicArea} onValueChange={setThematicArea}>
            <SelectTrigger id="area" className="rounded-lg">
              <SelectValue placeholder="Selecione uma área..." />
            </SelectTrigger>
            <SelectContent>
              {THEMATIC_AREAS.map((area) => (
                <SelectItem key={area} value={area}>
                  {area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label htmlFor="tags" className="font-600">
            Tags (até 5)
          </Label>
          <div className="flex gap-2">
            <Input
              id="tags"
              placeholder="Adicione uma tag e pressione + ou Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              maxLength={50}
              className="rounded-lg"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddTag}
              disabled={tags.length >= 5 || !tagInput.trim()}
              className="rounded-lg"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="bg-blue-100 text-blue-700 cursor-pointer hover:bg-blue-200"
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Suggested Max Members */}
        <div className="space-y-2">
          <Label htmlFor="members" className="font-600">
            Número Sugerido de Membros
          </Label>
          <Input
            id="members"
            type="number"
            min={1}
            max={50}
            value={suggestedMaxMembers}
            onChange={(e) => setSuggestedMaxMembers(parseInt(e.target.value) || 5)}
            className="rounded-lg"
          />
          <p className="text-xs text-gray-500">
            Sugestão de quantas pessoas trabalhariam neste projeto
          </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={resetForm} className="rounded-lg">
            Limpar
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>Salvando...</>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Criar Proposta
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

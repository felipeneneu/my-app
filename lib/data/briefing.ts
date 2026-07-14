export type ActivityEvent = {
  id: string;
  projectId: string;
  type: "note" | "task_created" | "milestone" | "system" | "commit";
  content: string;
  authorType: "user" | "system";
  metadata: string | null;
  createdAt: string;
};

export type BriefingData = {
  metadados: {
    marca_projeto: string;
    data_preenchimento: string;
  };
  bloco_1_estrutural: {
    o_que: {
      atuacao_empresa: string;
      objetivos: string;
      desafios: string;
      aplicabilidade: { impresso: boolean; digital: boolean };
    };
    como: {
      metodos_processos: string;
      competencias: string;
      posicionamento_preco: string;
    };
    por_que: {
      motivos_abertura: string;
      proposito: string;
    };
    cliente_ideal: {
      caracteristicas: string;
      demografia: string;
      dores: string;
    };
    entregas: {
      entrega_racional: string;
      entrega_emocional: string;
    };
    concorrentes: string[];
  };
  bloco_2_ramificacao: {
    atributos_visuais_escala: Record<string, number>;
    significados: string;
    historia: string;
    simbolos: string;
    objeto: string;
  };
  bloco_3_moodboard_insights: {
    considerar: string;
    desconsiderar: string;
    elementos_concorrentes: string;
    ideia_central: string;
    observacoes_gerais: string;
  };
};

const ATRIBUTOS_DEFAULTS: Record<string, number> = {
  tradicional_vs_moderna: 3,
  seria_vs_divertida: 3,
  acessivel_vs_exclusiva: 3,
  feminina_vs_masculina: 3,
  jovem_vs_madura: 3,
  discreta_vs_ousada: 3,
  tecnica_vs_descontraida: 3,
  rebelde_vs_corporativa: 3,
  luxuosa_vs_popular: 3,
  artesanal_vs_industrial: 3,
  delicada_vs_robusta: 3,
};

export function emptyBriefing(clientName = ""): BriefingData {
  return {
    metadados: {
      marca_projeto: clientName,
      data_preenchimento: new Date().toISOString().split("T")[0],
    },
    bloco_1_estrutural: {
      o_que: { atuacao_empresa: "", objetivos: "", desafios: "", aplicabilidade: { impresso: false, digital: true } },
      como: { metodos_processos: "", competencias: "", posicionamento_preco: "" },
      por_que: { motivos_abertura: "", proposito: "" },
      cliente_ideal: { caracteristicas: "", demografia: "", dores: "" },
      entregas: { entrega_racional: "", entrega_emocional: "" },
      concorrentes: [""],
    },
    bloco_2_ramificacao: {
      atributos_visuais_escala: { ...ATRIBUTOS_DEFAULTS },
      significados: "",
      historia: "",
      simbolos: "",
      objeto: "",
    },
    bloco_3_moodboard_insights: {
      considerar: "",
      desconsiderar: "",
      elementos_concorrentes: "",
      ideia_central: "",
      observacoes_gerais: "",
    },
  };
}

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import matplotlib.patheffects as pe

fig, ax = plt.subplots(1, 1, figsize=(16, 13))
ax.set_xlim(0, 16)
ax.set_ylim(0, 13)
ax.axis('off')
fig.patch.set_facecolor('white')
ax.set_facecolor('white')

# ─── Color Palette ───────────────────────────────────────────
C_CLIENT    = '#E8F4FD'   # light blue
C_CLIENT_B  = '#2196F3'
C_SERVER    = '#EDF7EE'   # light green
C_SERVER_B  = '#388E3C'
C_DB        = '#FFF3E0'   # light orange
C_DB_B      = '#E65100'
C_AI        = '#F3E5F5'   # light purple
C_AI_B      = '#7B1FA2'
C_EXT       = '#FCE4EC'   # light pink
C_EXT_B     = '#C62828'
C_ARROW     = '#546E7A'

def box(ax, x, y, w, h, label, sublabel, fc, ec, fontsize=9.5, subfontsize=7.8):
    patch = FancyBboxPatch((x, y), w, h,
                           boxstyle="round,pad=0.08",
                           linewidth=1.6, edgecolor=ec, facecolor=fc,
                           zorder=2)
    ax.add_patch(patch)
    # top-left accent stripe
    stripe = FancyBboxPatch((x, y + h - 0.38), w, 0.38,
                            boxstyle="round,pad=0.0",
                            linewidth=0, facecolor=ec, zorder=3,
                            clip_on=True)
    ax.add_patch(stripe)
    ax.text(x + w/2, y + h - 0.19, label,
            ha='center', va='center', fontsize=fontsize,
            fontweight='bold', color='white', zorder=4)
    if sublabel:
        body_center = y + (h - 0.38) / 2
        ax.text(x + w/2, body_center, sublabel,
                ha='center', va='center', fontsize=subfontsize,
                color='#37474F', zorder=4, linespacing=1.6,
                multialignment='center')

def arrow(ax, x1, y1, x2, y2, label='', color=C_ARROW):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='->', color=color,
                                lw=1.5, connectionstyle='arc3,rad=0.0'),
                zorder=5)
    if label:
        mx, my = (x1+x2)/2, (y1+y2)/2
        ax.text(mx+0.06, my, label, fontsize=6.8, color=color,
                ha='left', va='center', fontstyle='italic', zorder=6)

# ═══════════════════════════════════════════════════════════
#  LAYOUT
# ═══════════════════════════════════════════════════════════

# ── CLIENT (top center) ─────────────────────────────────────
box(ax, 4.0, 9.6, 8.0, 1.9,
    'Next.js 16  —  Client Layer',
    'React 19  |  TypeScript 5  |  Tailwind CSS 4  |  Radix UI\n'
    'Zustand 5  |  React Hook Form + Zod  |  Axios\n'
    'KaTeX  |  Mermaid 11  |  Recharts  |  react-markdown',
    C_CLIENT, C_CLIENT_B, fontsize=10)

# ── EXPRESS SERVER (center) ──────────────────────────────────
box(ax, 4.0, 6.5, 8.0, 2.5,
    'Express 4  —  REST API Server  (Node.js 20 + TypeScript)',
    'JWT Auth Middleware  |  Upload Middleware (Formidable)\n'
    '12 Route Modules  |  16 Controllers  |  Morgan Logging\n'
    'Drizzle ORM  |  Drizzle Kit migrations  |  bcryptjs',
    C_SERVER, C_SERVER_B, fontsize=10)

# ── STORAGE (bottom-left) ────────────────────────────────────
box(ax, 0.3, 0.4, 4.5, 5.4,
    'Storage Layer',
    'Neon PostgreSQL\n'
    '24 tables: users, courses, topics,\n'
    'materials, chunks, chats, math-chats,\n'
    'research papers, exams, sessions,\n'
    'results, study paths, quizzes\n\n'
    'Cloudflare R2\n'
    'PDF & document file storage\n'
    '(AWS SDK v3  |  S3-compatible)\n\n'
    'Pinecone Vector Store\n'
    'text-embedding-3-large  |  1024-dim',
    C_DB, C_DB_B, fontsize=10, subfontsize=7.4)

# ── AI SERVICES (bottom-center) ──────────────────────────────
box(ax, 5.2, 0.4, 5.4, 5.4,
    'AI Services',
    'LangChain  (orchestration layer)\n\n'
    'Google Gemini 2.5-flash\n'
    'RAG Chat  |  Exam Gen  |  Study Paths\n\n'
    'Google Gemini 3-flash-preview\n'
    'Math Assistant  |  Mermaid diagrams\n\n'
    'OpenAI text-embedding-3-large\n'
    'Semantic vector embeddings\n\n'
    'LlamaCloud\n'
    'PDF parsing & chunking pipeline',
    C_AI, C_AI_B, fontsize=10, subfontsize=7.4)

# ── EXTERNAL SERVICES (bottom-right) ─────────────────────────
box(ax, 11.2, 0.4, 4.5, 5.4,
    'External Services',
    'Camb.ai\n'
    'Bangla text-to-speech (TTS)\n'
    'Math assistant voice output\n\n'
    'Google Search API\n'
    'Web search for math queries\n'
    'Sources persisted per message\n\n'
    'LangChain Core\n'
    'HumanMessage  |  AIMessage\n'
    'SystemMessage  |  Chat history',
    C_EXT, C_EXT_B, fontsize=10, subfontsize=7.4)

# ═══════════════════════════════════════════════════════════
#  ARROWS
# ═══════════════════════════════════════════════════════════

# Client → Server  (bottom of client=9.6, top of server=9.0)
ax.annotate('', xy=(8.0, 9.00), xytext=(8.0, 9.62),
            arrowprops=dict(arrowstyle='<->', color=C_SERVER_B, lw=1.8),
            zorder=5)
ax.text(8.30, 9.31, 'HTTP  +  JWT Cookie', fontsize=7.2,
        color=C_SERVER_B, ha='left', va='center', fontstyle='italic')

# Server → Storage  (server bottom=6.5, storage top=5.8)  gap=0.7
ax.annotate('', xy=(2.55, 5.80), xytext=(4.20, 6.50),
            arrowprops=dict(arrowstyle='->', color=C_DB_B, lw=1.5,
                            connectionstyle='arc3,rad=0.0'), zorder=5)
ax.text(3.15, 6.35, 'ORM / R2 / Pinecone', fontsize=6.3,
        color=C_DB_B, ha='center', va='center', fontstyle='italic')

# Server → AI Services  (straight down, center)
ax.annotate('', xy=(7.90, 5.80), xytext=(7.90, 6.50),
            arrowprops=dict(arrowstyle='->', color=C_AI_B, lw=1.5,
                            connectionstyle='arc3,rad=0.0'), zorder=5)
ax.text(7.90, 6.15, 'LangChain  |  Gemini  |  OpenAI', fontsize=6.3,
        color=C_AI_B, ha='center', va='center', fontstyle='italic')

# Server → External  (server bottom right → external top)
ax.annotate('', xy=(13.45, 5.80), xytext=(11.80, 6.50),
            arrowprops=dict(arrowstyle='->', color=C_EXT_B, lw=1.5,
                            connectionstyle='arc3,rad=0.0'), zorder=5)
ax.text(12.83, 6.35, 'Camb.ai / Search API', fontsize=6.3,
        color=C_EXT_B, ha='center', va='center', fontstyle='italic')

# ═══════════════════════════════════════════════════════════
#  TITLE
# ═══════════════════════════════════════════════════════════
ax.text(8.0, 12.70,
        'CourseWise — System Architecture',
        ha='center', va='center', fontsize=13.5,
        fontweight='bold', color='#1A237E')
ax.text(8.0, 12.30,
        'AI-Powered Educational Platform for Bangladeshi University Students',
        ha='center', va='center', fontsize=9,
        color='#455A64', fontstyle='italic')

# thin border around entire figure
for spine in ['top','bottom','left','right']:
    ax.spines[spine].set_visible(False)

plt.tight_layout(pad=0.4)
out = '/Users/ajorsaha/Desktop/Personal/thesis-project/p-2-all-prototypes/architecture.png'
plt.savefig(out, dpi=300, bbox_inches='tight',
            facecolor='white', edgecolor='none')
plt.close()
print(f'Saved → {out}')

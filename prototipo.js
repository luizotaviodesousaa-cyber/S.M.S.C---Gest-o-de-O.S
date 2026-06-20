let ordensDeServico = JSON.parse(localStorage.getItem('ordensDeServico')) || [];
let proximoNumero = parseInt(localStorage.getItem('proximoNumero')) || 1;
let osSendoVisualizadaAtualmente = null;
window.isAdminEditing = false;

let filtroStatusAtual = 'Todos';
let filtroCategoriaAtual = 'Todas';

atualizarPainel();
atualizarNumeracaoJanela();
atualizarTermoGarantiaDinamico();

// Configurar drag and drop para comprovante
const areaUpload = document.getElementById('area-upload-comprovante');
areaUpload.addEventListener('dragover', (e) => {
    e.preventDefault();
    areaUpload.style.background = '#f8f9fa';
    areaUpload.style.borderColor = '#003d82';
});
areaUpload.addEventListener('dragleave', (e) => {
    e.preventDefault();
    areaUpload.style.background = '#fff';
    areaUpload.style.borderColor = '#0056b3';
});
areaUpload.addEventListener('drop', (e) => {
    e.preventDefault();
    areaUpload.style.background = '#fff';
    areaUpload.style.borderColor = '#0056b3';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        document.getElementById('input-comprovante').files = files;
        anexarComprovante({ target: { files: files } });
    }
});

function alternarAba(aba) {
    document.getElementById('tela-painel').classList.remove('ativa');
    document.getElementById('tela-nova-os').classList.remove('ativa');
    document.getElementById('btn-aba-painel').classList.remove('ativa');
    document.getElementById('btn-aba-nova').classList.remove('ativa');
    
    document.getElementById('bloco-status-gerenciamento').style.display = 'none';
    document.getElementById('btn-salvar-os').style.display = 'inline-block';
    document.getElementById('btn-adicionar-item-tabela').style.display = 'inline-block';
    document.getElementById('btn-imprimir-canhoto-apenas').style.display = 'none';
    document.getElementById('container-canhoto-avulso').style.display = 'none';
    $('.btn-acao-tabela').forEach(el => el.style.display = 'inline-block');
    
    osSendoVisualizadaAtualmente = null;
    definirBloqueioCampos(false); 

    if (aba === 'painel') {
        document.getElementById('tela-painel').classList.add('ativa');
        document.getElementById('btn-aba-painel').classList.add('ativa');
        atualizarPainel();
    } else {
        limparFormulario();
        document.getElementById('os-numero-atual').innerText = proximoNumero;
        document.querySelectorAll('.espelho-os-num').forEach(el => el.innerText = proximoNumero);
        document.getElementById('tela-nova-os').classList.add('ativa');
        document.getElementById('btn-aba-nova').classList.add('ativa');
        adicionarLinhaItem('', 1, 0); 
        atualizarTermoGarantiaDinamico();
    }
}

function $(seletor) { return document.querySelectorAll(seletor); }

function atualizarNumeracaoJanela() {
    document.getElementById('proximo-numero-aba').innerText = proximoNumero;
    document.getElementById('os-numero-atual').innerText = proximoNumero;
    document.querySelectorAll('.espelho-os-num').forEach(el => el.innerText = proximoNumero);
}

function espelharDadosSegundaFolha() {
    document.getElementById('espelho-cliente').innerText = document.getElementById('form-cliente').value || '...';
    document.getElementById('espelho-valor').innerText = document.getElementById('txt-valor-total').innerText;
    document.getElementById('espelho-pagamento').innerText = document.getElementById('form-forma-pagamento').value;
    document.getElementById('canhoto-endereco').innerText = document.getElementById('form-endereco').value || '...';
}

function imprimirDocumentoCompleto() {
    espelharDadosSegundaFolha();
    document.body.classList.remove('modo-impressao-canhoto');
    window.print();
}

function imprimirApenasCanhoto() {
    document.getElementById('canhoto-numero').innerText = document.getElementById('os-numero-atual').innerText;
    document.getElementById('canhoto-cliente').innerText = document.getElementById('form-cliente').value || '...';
    document.getElementById('canhoto-equip').innerText = document.getElementById('form-equip-modelo').value || 'Serviço Geral';
    document.getElementById('canhoto-pagamento').innerText = document.getElementById('form-forma-pagamento').value;
    document.getElementById('canhoto-valor').innerText = document.getElementById('txt-valor-total').innerText;
    document.getElementById('canhoto-endereco').innerText = document.getElementById('form-endereco').value || '...';

    document.body.classList.add('modo-impressao-canhoto');
    window.print();
}

function atualizarTermoGarantiaDinamico() {
    const tipoServico = document.getElementById('form-tipo-servico').value;
    const blocoGarantia = document.getElementById('bloco-texto-garantia');
    
    blocoGarantia.innerHTML = `
        Fica estabelecido que os serviços prestados sob a classificação de <b>${tipoServico}</b> possuem garantia legal de <b>90 (noventa) dias</b> em conformidade com o Artigo 26, Inciso II do Código de Defesa do Consumidor (Lei nº 8.078/90). 
        Esta garantia cobre exclusivamente os vícios e defeitos decorrentes da mão de obra aplicada ou de materiais por nós fornecidos e discriminados na Seção 5 deste documento. 
        A garantia extinguir-se-á imediatamente caso ocorra mau uso verificado, intervenções técnicas realizadas por terceiros não autorizados ou sinistros naturais no local da manutenção. Ao assinar, o cliente valida a entrega dos serviços em perfeita conformidade.
    `;
}

function adicionarLinhaItem(desc = '', qtd = 1, valor = 0, bloqueado = false) {
    const corpo = document.getElementById('corpo-tabela-itens');
    const tr = document.createElement('tr');
    
    tr.innerHTML = `
        <td><input type="text" class="editable item-desc" value="${desc}" placeholder="Ex: Mão de obra técnica..." ${bloqueado ? 'disabled' : ''}></td>
        <td><input type="number" class="editable text-right item-qtd" value="${qtd}" min="1" oninput="calcularTotalOS()" ${bloqueado ? 'disabled' : ''}></td>
        <td><input type="number" class="editable text-right item-val" value="${valor}" step="0.01" oninput="calcularTotalOS()" ${bloqueado ? 'disabled' : ''}></td>
        <td class="text-right item-subtotal">R$ 0,00</td>
        <td class="col-acao btn-acao-tabela"><button class="btn-danger" style="padding:2px 6px;" onclick="removerLinhaItem(this)">X</button></td>
    `;
    corpo.appendChild(tr);
    calcularTotalOS();
}

function removerLinhaItem(botao) {
    botao.parentElement.parentElement.remove();
    calcularTotalOS();
}

function calcularTotalOS() {
    let totalGeral = 0;
    const linhas = $('#corpo-tabela-itens tr');
    
    linhas.forEach(linha => {
        const qtd = parseFloat(linha.querySelector('.item-qtd').value) || 0;
        const valUnit = parseFloat(linha.querySelector('.item-val').value) || 0;
        const subtotal = qtd * valUnit;
        totalGeral += subtotal;
        linha.querySelector('.item-subtotal').innerText = subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    });
    
    const totalFormatado = totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('txt-valor-total').innerText = totalFormatado;
    espelharDadosSegundaFolha();
    return totalGeral;
}

function definirBloqueioCampos(bloquear) {
    const campos = ['form-tipo-servico', 'form-prazo', 'form-cliente', 'form-documento', 'form-endereco', 'form-escopo', 'cfg-nome-empresa', 'cfg-infos-empresa', 'form-celular', 'form-equip-modelo', 'form-equip-serie', 'form-forma-pagamento'];
    campos.forEach(id => {
        document.getElementById(id).disabled = bloquear;
    });
}

function definirFiltro(botaoAlvo) {
    const tipo = botaoAlvo.getAttribute('data-tipo');
    const valor = botaoAlvo.getAttribute('data-valor');

    $(`.filtro-btn[data-tipo="${tipo}"]`).forEach(btn => btn.classList.remove('ativo'));
    botaoAlvo.classList.add('ativo');

    if (tipo === 'status') filtroStatusAtual = valor;
    if (tipo === 'categoria') filtroCategoriaAtual = valor;

    filtrarTabelaPainel();
}

function filtrarTabelaPainel() {
    const textoBusca = document.getElementById('filtro-busca-texto').value.toLowerCase().trim();
    const linhasTabela = $('#corpo-tabela-painel tr');

    linhasTabela.forEach(linha => {
        if (linha.cells.length < 6) return;

        const nOS = inlineItem = linha.cells[0].textContent.toLowerCase();
        const clienteOS = linha.cells[2].textContent.toLowerCase();
        const statusOS = linha.cells[5].textContent.trim();
        const categoriaOS = linha.cells[1].textContent.trim();

        const atendeTexto = textoBusca === "" || nOS.includes(textoBusca) || clienteOS.includes(textoBusca);
        const atendeStatus = filtroStatusAtual === "Todos" || statusOS === filtroStatusAtual;
        const atendeCategoria = filtroCategoriaAtual === "Todas" || categoriaOS === filtroCategoriaAtual;

        if (atendeTexto && atendeStatus && atendeCategoria) {
            linha.style.display = "";
        } else {
            linha.style.display = "none";
        }
    });
}

function salvarNovaOS() {
    const tipo = document.getElementById('form-tipo-servico').value;
    const prazo = document.getElementById('form-prazo').value;
    const cliente = document.getElementById('form-cliente').value;
    const documento = document.getElementById('form-documento').value;
    const celular = document.getElementById('form-celular').value;
    const endereco = document.getElementById('form-endereco').value;
    const equipModelo = document.getElementById('form-equip-modelo').value;
    const equipSerie = document.getElementById('form-equip-serie').value;
    const escopo = document.getElementById('form-escopo').value;
    const formaPagamento = document.getElementById('form-forma-pagamento').value;

    let itensOS = [];
    $('#corpo-tabela-itens tr').forEach(linha => {
        itensOS.push({
            desc: linha.querySelector('.item-desc').value,
            qtd: linha.querySelector('.item-qtd').value,
            val: linha.querySelector('.item-val').value
        });
    });

    if (!cliente || !escopo || itensOS.length === 0) {
        alert("Campos obrigatórios ausentes! Forneça Cliente, Descrição e no mínimo 1 item financeiro.");
        return;
    }

    const totalCalculado = calcularTotalOS();

    const novaOS = {
        numero: proximoNumero,
        tipo: tipo,
        prazo: prazo,
        cliente: cliente,
        documento: documento,
        celular: celular,
        endereco: endereco,
        equipModelo: equipModelo,
        equipSerie: equipSerie,
        escopo: escopo,
        itens: itensOS,
        formaPagamento: formaPagamento,
        valorTotalFormatado: totalCalculado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        status: 'Aberta',
        situacaoCobranca: 'Aguardando Pagamento',
        comprovante: JSON.parse(sessionStorage.getItem('comprovanteTemporario') || 'null')
    };

    ordensDeServico.push(novaOS);
    proximoNumero++;

    localStorage.setItem('ordensDeServico', JSON.stringify(ordensDeServico));
    localStorage.setItem('proximoNumero', proximoNumero);

    alert(`Ordem de Serviço Nº ${novaOS.numero} gravada com sucesso!`);
    limparFormulario();
    atualizarNumeracaoJanela();
    alternarAba('painel');
}

function salvarNovaOrcamento() {
    const tipo = document.getElementById('form-tipo-servico').value;
    const prazo = document.getElementById('form-prazo').value;
    const cliente = document.getElementById('form-cliente').value;
    const documento = document.getElementById('form-documento').value;
    const celular = document.getElementById('form-celular').value;
    const endereco = document.getElementById('form-endereco').value;
    const equipModelo = document.getElementById('form-equip-modelo').value;
    const equipSerie = document.getElementById('form-equip-serie').value;
    const escopo = document.getElementById('form-escopo').value;
    const formaPagamento = document.getElementById('form-forma-pagamento').value;

    let itensOS = [];
    $('#corpo-tabela-itens tr').forEach(linha => {
        itensOS.push({
            desc: linha.querySelector('.item-desc').value,
            qtd: linha.querySelector('.item-qtd').value,
            val: linha.querySelector('.item-val').value
        });
    });

    if (!cliente || !escopo || itensOS.length === 0) {
        alert("Campos obrigatórios ausentes! Forneça Cliente, Descrição e no mínimo 1 item financeiro.");
        return;
    }

    const totalCalculado = calcularTotalOS();

    const novoOrcamento = {
        numero: proximoNumero,
        tipo: tipo,
        prazo: prazo,
        cliente: cliente,
        documento: documento,
        celular: celular,
        endereco: endereco,
        equipModelo: equipModelo,
        equipSerie: equipSerie,
        escopo: escopo,
        itens: itensOS,
        formaPagamento: formaPagamento,
        valorTotalFormatado: totalCalculado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        status: 'Orçamento',
        situacaoCobranca: 'Aguardando Pagamento',
        comprovante: JSON.parse(sessionStorage.getItem('comprovanteTemporario') || 'null'),
        numeroDefinitivoOS: null
    };

    ordensDeServico.push(novoOrcamento);
    proximoNumero++;

    localStorage.setItem('ordensDeServico', JSON.stringify(ordensDeServico));
    localStorage.setItem('proximoNumero', proximoNumero);

    alert(`Orçamento Nº ${novoOrcamento.numero} gravado com sucesso!\n\nQuando o cliente aprovar, você poderá convertê-lo em uma O.S.`);
    limparFormulario();
    atualizarNumeracaoJanela();
    alternarAba('painel');
}

function converterOrcamentoEmOS() {
    if (!osSendoVisualizadaAtualmente) return;
    
    const os = ordensDeServico.find(o => o.numero === osSendoVisualizadaAtualmente);
    if (!os || os.status !== 'Orçamento') {
        alert('Este item não é um orçamento válido!');
        return;
    }

    if (!confirm('Deseja converter este Orçamento em uma O.S. definitiva?\n\nO status mudará para "Aberta" e poderá ser gerenciado normalmente.')) {
        return;
    }

    os.status = 'Aberta';
    os.numeroDefinitivoOS = os.numero;
    localStorage.setItem('ordensDeServico', JSON.stringify(ordensDeServico));

    alert(`Orçamento Nº ${os.numero} convertido em O.S. com sucesso!`);
    document.getElementById('form-status-atualizador').value = 'Aberta';
    document.getElementById('btn-converter-orcamento').style.display = 'none';
    atualizarPainel();
}

function atualizarPainel() {
    const tabela = document.getElementById('corpo-tabela-painel');
    tabela.innerHTML = '';

    if (ordensDeServico.length === 0) {
        tabela.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#999; padding: 20px;">Nenhum registro encontrado.</td></tr>`;
        return;
    }

    [...ordensDeServico].reverse().forEach((os) => {
        const tr = document.createElement('tr');
        let badgeClass = os.status === 'Concluída' ? 'status-concluida' : (os.status === 'Cancelada' ? 'status-cancelada' : (os.status === 'Orçamento' ? 'status-orcamento' : 'status-aberta'));
        let cobClass = os.situacaoCobranca === 'Pago' ? 'fin-pago' : 'fin-pendente';
        
        tr.innerHTML = `
            <td><strong>#${os.numero}</strong></td>
            <td><span class="cat-badge">${os.tipo}</span></td>
            <td><b>${os.cliente}</b><br><small style="color:#666">${os.documento || 'Sem doc'}</small></td>
            <td><span style="color:#0056b3; font-weight:500;">${os.equipModelo || 'Geral'}</span><br><small style="color:#555">${os.escopo.substring(0,60)}...</small></td>
            <td><b>${os.valorTotalFormatado}</b><br><span class="financeiro-badge ${cobClass}">${os.situacaoCobranca || 'Pendente'}</span></td>
            <td><span class="status-badge ${badgeClass}">${os.status}</span></td>
            <td class="col-acao">
                <button class="btn btn-warning btn-sm" onclick="visualizarOSSalva(${os.numero})">👁️ Ver / Painel</button>
                <button class="btn btn-danger btn-sm" style="background:#6c757d;" onclick="excluirOS(${os.numero})">🗑️ Deletar</button>
            </td>
        `;
        tabela.appendChild(tr);
    });
    filtrarTabelaPainel();
}

function visualizarOSSalva(numero) {
    const os = ordensDeServico.find(o => o.numero === numero);
    if(os) {
        osSendoVisualizadaAtualmente = numero;

        document.getElementById('os-numero-atual').innerText = os.numero;
        document.querySelectorAll('.espelho-os-num').forEach(el => el.innerText = os.numero);
        document.getElementById('form-tipo-servico').value = os.tipo;
        document.getElementById('form-prazo').value = os.prazo;
        document.getElementById('form-cliente').value = os.cliente;
        document.getElementById('form-documento').value = os.documento || '';
        document.getElementById('form-celular').value = os.celular || '';
        document.getElementById('form-endereco').value = os.endereco;
        document.getElementById('form-equip-modelo').value = os.equipModelo || '';
        document.getElementById('form-equip-serie').value = os.equipSerie || '';
        document.getElementById('form-escopo').value = os.escopo;
        document.getElementById('form-forma-pagamento').value = os.formaPagamento || 'Pix';
        
        document.getElementById('form-status-atualizador').value = os.status;
        document.getElementById('form-cobranca-atualizador').value = os.situacaoCobranca || 'Aguardando Pagamento';

        document.getElementById('corpo-tabela-itens').innerHTML = '';
        os.itens.forEach(item => {
            adicionarLinhaItem(item.desc, item.qtd, item.val, true);
        });

        // Carregar comprovante se existir
        if (os.comprovante && os.comprovante.nome) {
            exibirComprovanteAnexado(os.comprovante.nome, os.comprovante.tamanho);
        } else {
            removerComprovante();
        }

        document.getElementById('btn-salvar-os').style.display = 'none';
        document.getElementById('btn-adicionar-item-tabela').style.display = 'none';
        document.getElementById('bloco-status-gerenciamento').style.display = 'flex';
        document.getElementById('btn-imprimir-canhoto-apenas').style.display = 'inline-block';
        document.getElementById('container-canhoto-avulso').style.display = 'block';
        
        // Mostrar botão de converter se for orçamento
        document.getElementById('btn-converter-orcamento').style.display = os.status === 'Orçamento' ? 'inline-block' : 'none';
        
        $('.btn-acao-tabela').forEach(el => el.style.display = 'none');

        if (!window.isAdminEditing) {
            definirBloqueioCampos(true);
        } else {
            definirBloqueioCampos(false);
            const saveBtn = document.getElementById('btn-save-edits');
            if (saveBtn) saveBtn.style.display = 'inline-block';
        } 
        atualizarTermoGarantiaDinamico();
        espelharDadosSegundaFolha();
        atualizarStatusFormaPagamento();

        document.getElementById('tela-painel').classList.remove('ativa');
        document.getElementById('tela-nova-os').classList.add('ativa');
        calcularTotalOS();
    }
}

function salvarStatusAtualizado() {
    if (osSendoVisualizadaAtualmente) {
        const os = ordensDeServico.find(o => o.numero === osSendoVisualizadaAtualmente);
        if (os) {
            os.status = document.getElementById('form-status-atualizador').value;
            os.situacaoCobranca = document.getElementById('form-cobranca-atualizador').value;
            localStorage.setItem('ordensDeServico', JSON.stringify(ordensDeServico));
            alert(`O.S. Nº ${os.numero} atualizada com sucesso!`);
            alternarAba('painel');
        }
    }
}

function enviarWhatsAppOS() {
    if (osSendoVisualizadaAtualmente) {
        const os = ordensDeServico.find(o => o.numero === osSendoVisualizadaAtualmente);
        if (os) {
            let numeroTel = os.celular.replace(/\D/g, ''); 
            if(!numeroTel) { alert("Não há WhatsApp válido!"); return; }
            if (numeroTel.length === 11 || numeroTel.length === 10) numeroTel = "55" + numeroTel;

            const quebraLinha = "%0A";
            let textoMsg = `*Olá, ${os.cliente}!*${quebraLinha}Resumo da *O.S. Nº ${os.numero}*${quebraLinha}💰 *Valor:* ${os.valorTotalFormatado} (${os.status})`;
            window.open(`https://api.whatsapp.com/send?phone=${numeroTel}&text=${textoMsg}`, '_blank');
        }
    }
}

function excluirOS(numero) {
    if(confirm(`Excluir permanentemente a O.S. Nº ${numero}?`)) {
        ordensDeServico = ordensDeServico.filter(o => o.numero !== numero);
        localStorage.setItem('ordensDeServico', JSON.stringify(ordensDeServico));
        atualizarPainel();
    }
}

function limparFormulario() {
    document.getElementById('btn-imprimir-canhoto-apenas').style.display = 'none';
    document.getElementById('container-canhoto-avulso').style.display = 'none';
    document.getElementById('form-cliente').value = '';
    document.getElementById('form-documento').value = '';
    document.getElementById('form-celular').value = '';
    document.getElementById('form-endereco').value = '';
    document.getElementById('form-equip-modelo').value = '';
    document.getElementById('form-equip-serie').value = '';
    document.getElementById('form-escopo').value = '';
    document.getElementById('corpo-tabela-itens').innerHTML = '';
    document.getElementById('txt-valor-total').innerText = 'R$ 0,00';
    removerComprovante();
    atualizarTermoGarantiaDinamico();
    espelharDadosSegundaFolha();
}

// Funções para Gerenciar Comprovante de Pagamento
function anexarComprovante(event) {
    const file = event.target.files[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    if (!allowedTypes.includes(file.type)) {
        alert('⚠️ Formato inválido! Aceitos: PDF, JPG, PNG');
        return;
    }

    if (file.size > maxSize) {
        alert('⚠️ Arquivo muito grande! Máximo: 5MB');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const comprovante = {
            nome: file.name,
            tipo: file.type,
            tamanho: file.size,
            dados: e.target.result
        };

        osSendoVisualizadaAtualmente ? 
            atualizarComprovanteOS(comprovante) : 
            salvarComprovanteTemporario(comprovante);

        exibirComprovanteAnexado(file.name, file.size);
        atualizarStatusFormaPagamento();
    };
    reader.readAsDataURL(file);
}

function salvarComprovanteTemporario(comprovante) {
    sessionStorage.setItem('comprovanteTemporario', JSON.stringify(comprovante));
}

function atualizarComprovanteOS(comprovante) {
    const os = ordensDeServico.find(o => o.numero === osSendoVisualizadaAtualmente);
    if (os) {
        os.comprovante = comprovante;
        localStorage.setItem('ordensDeServico', JSON.stringify(ordensDeServico));
        // Atualizar automaticamente status para Pago quando PIX ou Boleto
        if (['Pix', 'Boleto Bancário'].includes(os.formaPagamento)) {
            os.situacaoCobranca = 'Pago';
            document.getElementById('form-cobranca-atualizador').value = 'Pago';
            salvarStatusAtualizado();
        }
    }
}

function exibirComprovanteAnexado(nome, tamanho) {
    document.getElementById('comprovante-nome').innerText = '✅ ' + nome;
    document.getElementById('comprovante-tamanho').innerText = formatarTamanhoArquivo(tamanho);
    document.getElementById('comprovante-anexado').classList.add('ativo');
    document.getElementById('area-upload-comprovante').classList.add('pronto');
}

function removerComprovante() {
    document.getElementById('input-comprovante').value = '';
    document.getElementById('comprovante-anexado').classList.remove('ativo');
    document.getElementById('area-upload-comprovante').classList.remove('pronto');
    sessionStorage.removeItem('comprovanteTemporario');
    
    if (osSendoVisualizadaAtualmente) {
        const os = ordensDeServico.find(o => o.numero === osSendoVisualizadaAtualmente);
        if (os) {
            os.comprovante = null;
            localStorage.setItem('ordensDeServico', JSON.stringify(ordensDeServico));
        }
    }
}

function visualizarComprovante() {
    let comprovante = null;

    if (osSendoVisualizadaAtualmente) {
        const os = ordensDeServico.find(o => o.numero === osSendoVisualizadaAtualmente);
        comprovante = os?.comprovante;
    } else {
        const temp = sessionStorage.getItem('comprovanteTemporario');
        comprovante = temp ? JSON.parse(temp) : null;
    }

    if (!comprovante) {
        alert('Nenhum comprovante anexado!');
        return;
    }

    const popup = window.open();
    if (comprovante.tipo === 'application/pdf') {
        popup.document.write(`<embed src="${comprovante.dados}" type="application/pdf" style="width:100%; height:100vh;"/>`);
    } else {
        popup.document.write(`<img src="${comprovante.dados}" style="max-width:100%; height:auto;"/>`);
    }
}

function formatarTamanhoArquivo(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function atualizarStatusFormaPagamento() {
    const forma = document.getElementById('form-forma-pagamento').value;
    const infoBloqueio = document.getElementById('info-bloqueio-pix-boleto');
    const seletor = document.getElementById('form-cobranca-atualizador');
    const temComprovante = document.getElementById('comprovante-anexado').classList.contains('ativo');

    if (['Pix', 'Boleto Bancário'].includes(forma)) {
        infoBloqueio.classList.add('ativo');
        if (!temComprovante) {
            seletor.disabled = true;
            seletor.style.opacity = '0.5';
            seletor.style.cursor = 'not-allowed';
        } else {
            seletor.disabled = false;
            seletor.style.opacity = '1';
            seletor.style.cursor = 'pointer';
        }
    } else {
        infoBloqueio.classList.remove('ativo');
        seletor.disabled = false;
        seletor.style.opacity = '1';
        seletor.style.cursor = 'pointer';
    }
}

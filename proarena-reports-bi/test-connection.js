import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function testConnection() {
  console.log('🔍 Testando conexão com o banco de dados...\n');
  
  // Mostrar a URL (sem a senha completa)
  const url = process.env.DATABASE_URL || '';
  const urlParts = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  
  if (urlParts) {
    console.log('📋 Configuração detectada:');
    console.log(`   Usuário: ${urlParts[1]}`);
    console.log(`   Senha: ${urlParts[2].substring(0, 3)}***${urlParts[2].substring(urlParts[2].length - 3)}`);
    console.log(`   Host: ${urlParts[3]}`);
    console.log(`   Porta: ${urlParts[4]}`);
    console.log(`   Database: ${urlParts[5]}\n`);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('⏳ Conectando...');
    await client.connect();
    console.log('✅ Conexão estabelecida com sucesso!\n');
    
    console.log('📊 Testando query...');
    const result = await client.query('SELECT version()');
    console.log('✅ Query executada com sucesso!');
    console.log(`   PostgreSQL: ${result.rows[0].version.split(' ')[1]}\n`);
    
    console.log('🎉 Tudo funcionando! Pode executar as migrations.');
    
  } catch (error) {
    console.error('❌ Erro na conexão:\n');
    console.error(`   Código: ${error.code || 'N/A'}`);
    console.error(`   Mensagem: ${error.message}\n`);
    
    if (error.code === 'SELF_SIGNED_CERT_IN_CHAIN') {
      console.log('💡 Solução: Problema com certificado SSL');
      console.log('   → O código já está configurado para aceitar certificados auto-assinados');
    } else if (error.message.includes('SASL') || error.message.includes('authentication')) {
      console.log('💡 Possíveis causas:');
      console.log('   1. ❌ Senha incorreta na URL');
      console.log('   2. ❌ Usuário incorreto');
      console.log('   3. ❌ Banco de dados pausado no Supabase');
      console.log('   4. ❌ URL copiada incorretamente\n');
      console.log('✅ Solução:');
      console.log('   1. Acesse: https://app.supabase.com/');
      console.log('   2. Selecione seu projeto');
      console.log('   3. Vá em Settings → Database');
      console.log('   4. Role até "Connection Pooling"');
      console.log('   5. Copie a "Connection string" completa');
      console.log('   6. Cole no arquivo .env substituindo DATABASE_URL=...');
    } else if (error.message.includes('timeout')) {
      console.log('💡 Solução: Problema de rede/firewall');
      console.log('   → Verifique sua conexão com internet');
      console.log('   → Verifique se o Supabase não está bloqueado');
    } else {
      console.log('💡 Erro desconhecido. Verifique:');
      console.log('   1. Se o arquivo .env existe');
      console.log('   2. Se DATABASE_URL está definida');
      console.log('   3. Se a URL está no formato correto');
    }
  } finally {
    await client.end();
    console.log('\n🔌 Conexão encerrada.');
  }
}

testConnection();


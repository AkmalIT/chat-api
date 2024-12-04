from transformers import AutoModelForCausalLM, AutoTokenizer
from flask import Flask, request, jsonify
import torch

class AIGenerator:
    def __init__(self, model_name='gpt2-medium'):
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForCausalLM.from_pretrained(model_name)
        
        self.generation_config = {
            'max_length': 200,  
            'num_return_sequences': 1,
            'temperature': 0.8,
            'top_k': 60,
            'top_p': 0.9,
            'no_repeat_ngram_size': 2,
            'do_sample': True
        }   

    def generate_response(self, prompt):
        try:
            full_prompt = f"""
            You are helpful  an AI assistant.             
            Query: {prompt}
            Detailed answer:"""
            
            input_ids = self.tokenizer.encode(full_prompt, return_tensors='pt')
            
            output = self.model.generate(
                input_ids, 
                **self.generation_config
            )
            
            response = self.tokenizer.decode(output[0], skip_special_tokens=True)
            
            clean_response = response.split('Detailed answer:')[-1].strip()
            
            if prompt.lower() in ['hi', 'hello', 'hey']:
                clean_response = f"""Hello! I'm ChatGpt clone, an AI assistant created by Akmal Rustamov. 
I'm here to help you with a wide range of tasks - from analysis and writing to problem-solving and creative projects. 
How can I assist you today? Feel free to ask me anything, and I'll do my best to provide a helpful and informative response."""
            
            if len(clean_response.split()) < 5:
                clean_response = f"""I noticed your message was quite brief. 
Could you provide more context or details about what you're looking for? 
I'm ready to help you with a variety of tasks and questions."""
            
            return clean_response
        
        except Exception as e:
            return f"An error occurred while processing your request: {str(e)}"

app = Flask(__name__)
ai_generator = AIGenerator()

@app.route('/generate', methods=['POST'])
def generate():
    data = request.json
    prompt = data.get('prompt', '')
    
    response = ai_generator.generate_response(prompt)
    
    return jsonify({
        "generated_text": response
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)